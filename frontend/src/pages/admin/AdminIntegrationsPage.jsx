// src/pages/admin/AdminIntegrationsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Écran 3.3 — « Configuration des Protocoles, Intégrations API & Logs d'Audit »
// Portail ADMIN. Reprend la maquette du dossier UI/UX :
//   1. Intégrations système  : SMTP (envoi) · IMAP (réception)
//   2. Logs système & audit de sécurité
//
// Ce que fait réellement chaque bloc côté serveur :
//   • SMTP  → GET/PATCH /api/integrations/smtp/   (SMTPConfiguration)   ✅ réel
//   • IMAP  → GET/PATCH /api/integrations/imap/   (IMAPConfiguration)   ✅ réel
//   • Tests → POST /api/integrations/{smtp,imap}/test/   ⚠️ patch backend requis
//   • Logs  → GET /api/logs/ (AuditLog + filtres django-filter)         ✅ réel
//
// Rappel du fonctionnement métier (cahier des charges) :
//   SMTP — l'admin écrit un message depuis le portail ; le backend le remet au
//   serveur d'envoi (Gmail / Outlook) qui le délivre au destinataire.
//   IMAP — un client écrit depuis sa messagerie vers l'adresse @zay.ma ; le
//   relevé automatique importe le message dans le portail sous forme de ticket,
//   ce qui évite à l'admin et au superviseur d'ouvrir leur boîte mail.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Send, Inbox, ShieldAlert, Loader2,
  CheckCircle2, XCircle, Download, RefreshCw,
} from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminLayout'
import { toast } from '../../components/admin/toast'
import { exportToCsv } from '../../utils/exportCsv'
import { logsApi } from '../../api/adminApi'
import {
  getSmtpConfig, updateSmtpConfig, testSmtp,
  getImapConfig, updateImapConfig, testImap,
  messageErreur,
} from '../../api/integrationsService'

const CHIFFREMENTS = ['TLS', 'SSL']

// Onglets de la table des logs — chaque onglet correspond à une valeur réelle
// de AuditLog.ActionType (ou au drapeau is_suspicious côté backend).
const ONGLETS_LOGS = [
  { cle: 'ALL', label: 'Tous', params: {} },
  { cle: 'LOGIN', label: 'Connexions', params: { action_type: 'LOGIN' } },
  { cle: 'LOGIN_FAILED', label: 'Échecs', params: { action_type: 'LOGIN_FAILED' } },
  { cle: 'EMAIL_SENT', label: 'Emails envoyés', params: { action_type: 'EMAIL_SENT' } },
  { cle: 'EMAIL_FAILED', label: 'Échecs email', params: { action_type: 'EMAIL_FAILED' } },
  { cle: 'SECURITY', label: 'Sécurité', params: { is_suspicious: true } },
]

// ── Petits composants de présentation ───────────────────────────────────────

function Carte({ titre, Icone, actif, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icone size={15} className="text-[#1E3A5F]" />
          <h3 className="text-sm font-semibold text-[#1E3A5F]">{titre}</h3>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${actif ? 'bg-emerald-500' : 'bg-slate-300'}`}
          title={actif ? 'Actif' : 'Inactif'}
        />
      </div>
      <div className="p-4 space-y-3 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

function Champ({ label, aide, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <input
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-[#2D6A9F]/40 disabled:bg-slate-50"
        {...props}
      />
      {aide && <p className="text-[10px] text-slate-400 mt-1">{aide}</p>}
    </div>
  )
}

function Selecteur({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <select
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#2D6A9F]/40"
        {...props}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

// ── Écran ───────────────────────────────────────────────────────────────────

export default function AdminIntegrationsPage() {
  // Configurations
  const [smtp, setSmtp] = useState(null)
  const [imap, setImap] = useState(null)
  const [chargement, setChargement] = useState(true)

  // États d'action (par bloc, pour désactiver le bon bouton seulement)
  const [enCours, setEnCours] = useState({})       // { smtpSave: true, imapTest: true, ... }
  const [resultatTest, setResultatTest] = useState({}) // { smtp: {ok, message}, imap: {...} }

  // Logs
  const [logs, setLogs] = useState([])
  const [ongletLog, setOngletLog] = useState('ALL')
  const [rechercheLog, setRechercheLog] = useState('')
  const [rechercheAppliquee, setRechercheAppliquee] = useState('')
  // Premier chargement uniquement : au changement d'onglet on garde les lignes
  // précédentes à l'écran pour éviter que le bloc ne se replie et fasse sauter
  // le défilement de la page.
  const [logsInitialises, setLogsInitialises] = useState(false)
  const [rafraichissementLogs, setRafraichissementLogs] = useState(true)

  // Identifiant de la dernière requête logs émise : une réponse arrivée en
  // retard (onglet déjà changé entre-temps) est ignorée.
  const requeteLogs = useRef(0)

  const occupe = (cle, valeur) => setEnCours((e) => ({ ...e, [cle]: valeur }))

  // ── Chargement initial des deux configurations ────────────────────────────
  useEffect(() => {
    Promise.allSettled([getSmtpConfig(), getImapConfig()]).then(([rSmtp, rImap]) => {
      if (rSmtp.status === 'fulfilled') {
        setSmtp({ ...rSmtp.value, password: '' })
      } else {
        toast.error(messageErreur(rSmtp.reason, 'Configuration SMTP indisponible.'))
        setSmtp({ host: '', port: 587, username: '', password: '', encryption: 'TLS', from_email: '', enabled: false })
      }
      if (rImap.status === 'fulfilled') {
        setImap({ ...rImap.value, password: '' })
      } else {
        toast.error(messageErreur(rImap.reason, 'Configuration IMAP indisponible.'))
        setImap({ host: '', port: 993, username: '', password: '', encryption: 'SSL', enabled: false })
      }
      setChargement(false)
    })
  }, [])

  // ── Chargement des logs ───────────────────────────────────────────────────
  // Le debounce ne porte que sur la saisie de recherche ; un clic sur un onglet
  // déclenche la requête immédiatement.
  useEffect(() => {
    const t = setTimeout(() => setRechercheAppliquee(rechercheLog), 300)
    return () => clearTimeout(t)
  }, [rechercheLog])

  const chargerLogs = useCallback(() => {
    const onglet = ONGLETS_LOGS.find((o) => o.cle === ongletLog) ?? ONGLETS_LOGS[0]
    const idRequete = ++requeteLogs.current
    setRafraichissementLogs(true)
    logsApi
      .list({ ...onglet.params, search: rechercheAppliquee || undefined, page_size: 100 })
      .then((res) => {
        if (idRequete !== requeteLogs.current) return   // réponse périmée
        setLogs(res.data.results ?? [])
      })
      .catch(() => {
        if (idRequete !== requeteLogs.current) return
        setLogs([])
      })
      .finally(() => {
        if (idRequete !== requeteLogs.current) return
        setLogsInitialises(true)
        setRafraichissementLogs(false)
      })
  }, [ongletLog, rechercheAppliquee])

  useEffect(() => { chargerLogs() }, [chargerLogs])

  // ── Actions SMTP ──────────────────────────────────────────────────────────
  const enregistrerSmtp = async () => {
    if (!smtp.host || !smtp.from_email) {
      toast.error('Serveur SMTP et email expéditeur sont obligatoires.')
      return
    }
    occupe('smtpSave', true)
    try {
      const maj = await updateSmtpConfig(smtp)
      setSmtp({ ...maj, password: '' })
      toast.success('Configuration SMTP enregistrée.')
    } catch (e) {
      toast.error(messageErreur(e, 'Enregistrement SMTP impossible.'))
    } finally {
      occupe('smtpSave', false)
    }
  }

  const testerSmtp = async () => {
    occupe('smtpTest', true)
    setResultatTest((r) => ({ ...r, smtp: null }))
    try {
      const res = await testSmtp(smtp.from_email)
      setResultatTest((r) => ({
        ...r,
        smtp: { ok: true, message: res.detail ?? `Email de test envoyé à ${smtp.from_email}.` },
      }))
    } catch (e) {
      setResultatTest((r) => ({ ...r, smtp: { ok: false, message: messageErreur(e, 'Envoi de test échoué.') } }))
    } finally {
      occupe('smtpTest', false)
    }
  }

  // ── Actions IMAP ──────────────────────────────────────────────────────────
  const enregistrerImap = async () => {
    if (!imap.host || !imap.username) {
      toast.error('Serveur IMAP et email de réception sont obligatoires.')
      return
    }
    occupe('imapSave', true)
    try {
      const maj = await updateImapConfig(imap)
      setImap({ ...maj, password: '' })
      toast.success('Configuration IMAP enregistrée.')
    } catch (e) {
      toast.error(messageErreur(e, 'Enregistrement IMAP impossible.'))
    } finally {
      occupe('imapSave', false)
    }
  }

  const testerImap = async () => {
    occupe('imapTest', true)
    setResultatTest((r) => ({ ...r, imap: null }))
    try {
      const res = await testImap()
      setResultatTest((r) => ({
        ...r,
        imap: { ok: true, message: res.detail ?? 'Connexion IMAP établie.' },
      }))
    } catch (e) {
      setResultatTest((r) => ({ ...r, imap: { ok: false, message: messageErreur(e, 'Connexion IMAP échouée.') } }))
    } finally {
      occupe('imapTest', false)
    }
  }

  // ── Export des logs ───────────────────────────────────────────────────────
  const exporterLogs = () => {
    if (!logs.length) {
      toast.error('Aucune ligne à exporter.')
      return
    }
    exportToCsv(
      `logs_integrations_${new Date().toISOString().slice(0, 10)}.csv`,
      logs.map((l) => ({
        date_heure: l.created_at,
        niveau: l.is_suspicious ? 'ALERTE' : 'INFO',
        utilisateur: l.user_email ?? l.user_full_name ?? 'Système',
        action: l.description,
        ip: l.ip_address ?? '—',
      }))
    )
    toast.success(`${logs.length} lignes exportées.`)
  }

  if (chargement) {
    return (
      <>
        <AdminPageHeader title="Intégrations & logs système" subtitle="Écran 3.3" />
        <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Chargement des configurations…
        </div>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title="Intégrations & logs système"
        subtitle="Protocoles de messagerie, API et journal d'audit de sécurité"
        action={
          <button
            type="button"
            onClick={chargerLogs}
            className="flex items-center gap-2 px-4 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* ── 1. Intégrations système ─────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Intégrations système</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SMTP */}
            <Carte titre="SMTP — Envoi" Icone={Send} actif={smtp.enabled}>
              <Champ
                label="Serveur SMTP"
                placeholder="smtp.gmail.com"
                value={smtp.host ?? ''}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              />
              <Champ
                label="Port"
                type="number"
                placeholder="587"
                value={smtp.port ?? ''}
                onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                aide="587 pour TLS, 465 pour SSL."
              />
              <Champ
                label="Email expéditeur"
                type="email"
                placeholder="support@zay.ma"
                value={smtp.from_email ?? ''}
                onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })}
                aide="Adresse affichée comme expéditeur des messages du portail."
              />
              <Champ
                label="Identifiant"
                placeholder="support@zay.ma"
                value={smtp.username ?? ''}
                onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
              />
              <Champ
                label="Mot de passe"
                type="password"
                placeholder="•••••••••••• (inchangé)"
                value={smtp.password ?? ''}
                onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                aide="Laisser vide pour conserver le mot de passe actuel."
              />
              <Selecteur
                label="Chiffrement"
                options={CHIFFREMENTS}
                value={smtp.encryption ?? 'TLS'}
                onChange={(e) => setSmtp({ ...smtp, encryption: e.target.value })}
              />

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!smtp.enabled}
                  onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
                />
                Activer l&apos;envoi des emails depuis le portail
              </label>

              {resultatTest.smtp && (
                <div
                  className={`flex gap-2 rounded-lg px-3 py-2 text-[11px] ${
                    resultatTest.smtp.ok
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {resultatTest.smtp.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>{resultatTest.smtp.message}</span>
                </div>
              )}

              <div className="mt-auto pt-1 space-y-2">
                <button
                  type="button"
                  onClick={testerSmtp}
                  disabled={enCours.smtpTest}
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-lg
                             py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {enCours.smtpTest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Tester l&apos;envoi
                </button>
                <button
                  type="button"
                  onClick={enregistrerSmtp}
                  disabled={enCours.smtpSave}
                  className="w-full bg-[#1E3A5F] text-white rounded-lg py-2 text-sm font-medium
                             hover:bg-[#1E3A5F]/90 disabled:opacity-50"
                >
                  {enCours.smtpSave ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </Carte>

            {/* IMAP */}
            <Carte titre="IMAP — Réception" Icone={Inbox} actif={imap.enabled}>
              <Champ
                label="Serveur IMAP"
                placeholder="imap.gmail.com"
                value={imap.host ?? ''}
                onChange={(e) => setImap({ ...imap, host: e.target.value })}
              />
              <Champ
                label="Port"
                type="number"
                placeholder="993"
                value={imap.port ?? ''}
                onChange={(e) => setImap({ ...imap, port: Number(e.target.value) })}
                aide="993 pour SSL, 143 pour TLS."
              />
              <Champ
                label="Email de réception"
                type="email"
                placeholder="tickets@zay.ma"
                value={imap.username ?? ''}
                onChange={(e) => setImap({ ...imap, username: e.target.value })}
                aide="Boîte relevée automatiquement : chaque message y devient un ticket."
              />
              <Champ
                label="Mot de passe"
                type="password"
                placeholder="•••••••••••• (inchangé)"
                value={imap.password ?? ''}
                onChange={(e) => setImap({ ...imap, password: e.target.value })}
                aide="Laisser vide pour conserver le mot de passe actuel."
              />
              <Selecteur
                label="Chiffrement"
                options={CHIFFREMENTS}
                value={imap.encryption ?? 'SSL'}
                onChange={(e) => setImap({ ...imap, encryption: e.target.value })}
              />

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Fréquence de relève
                </label>
                <div className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500">
                  Toutes les 2 minutes
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pilotée par le planificateur système qui appelle
                  <span className="font-mono"> POST /api/integrations/imap/poll/</span> — non modifiable
                  depuis le portail (le modèle IMAPConfiguration ne porte pas encore ce champ).
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={!!imap.enabled}
                  onChange={(e) => setImap({ ...imap, enabled: e.target.checked })}
                />
                Activer la relève automatique de la boîte mail
              </label>

              {resultatTest.imap && (
                <div
                  className={`flex gap-2 rounded-lg px-3 py-2 text-[11px] ${
                    resultatTest.imap.ok
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {resultatTest.imap.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>{resultatTest.imap.message}</span>
                </div>
              )}

              <div className="mt-auto pt-1 space-y-2">
                <button
                  type="button"
                  onClick={testerImap}
                  disabled={enCours.imapTest}
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 rounded-lg
                             py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {enCours.imapTest ? <Loader2 size={14} className="animate-spin" /> : <Inbox size={14} />}
                  Tester la connexion
                </button>
                <button
                  type="button"
                  onClick={enregistrerImap}
                  disabled={enCours.imapSave}
                  className="w-full bg-[#1E3A5F] text-white rounded-lg py-2 text-sm font-medium
                             hover:bg-[#1E3A5F]/90 disabled:opacity-50"
                >
                  {enCours.imapSave ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </Carte>

          </div>
        </section>

        {/* ── 2. Logs & audit ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldAlert size={15} /> Logs système &amp; audit de sécurité
              {rafraichissementLogs && logsInitialises && (
                <Loader2 size={13} className="animate-spin text-slate-400" />
              )}
            </h2>
            <button
              type="button"
              onClick={exporterLogs}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-slate-300 text-xs hover:bg-slate-50"
            >
              <Download size={13} /> Exporter les logs
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
              {ONGLETS_LOGS.map((o) => (
                <button
                  key={o.cle}
                  type="button"
                  onClick={() => setOngletLog(o.cle)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    ongletLog === o.cle
                      ? 'bg-[#1E3A5F] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
              <input
                value={rechercheLog}
                onChange={(e) => setRechercheLog(e.target.value)}
                placeholder="Rechercher (utilisateur, description)…"
                className="ml-auto min-w-56 border border-slate-300 rounded-lg px-3 py-1.5 text-xs
                           focus:outline-none focus:ring-2 focus:ring-[#2D6A9F]/40"
              />
            </div>

            <div className="min-h-[460px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date / heure</th>
                  <th className="px-4 py-2.5 font-medium">Niveau</th>
                  <th className="px-4 py-2.5 font-medium">Utilisateur</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">IP</th>
                </tr>
              </thead>
              <tbody
                className={
                  rafraichissementLogs && logsInitialises
                    ? 'opacity-50 transition-opacity duration-150'
                    : 'transition-opacity duration-150'
                }
              >
                {!logsInitialises ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chargement…</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Aucune entrée pour ce filtre.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr
                      key={l.id}
                      className={`border-t border-slate-100 ${l.is_suspicious ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                        {new Date(l.created_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l.is_suspicious
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {l.is_suspicious ? 'ALERTE' : 'INFO'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {l.user_email ?? l.user_full_name ?? 'Système'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{l.description}</td>
                      <td
                        className={`px-4 py-2.5 font-mono text-xs ${
                          l.is_suspicious ? 'text-red-600 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {l.ip_address ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
