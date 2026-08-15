# backend/ai/classification.py
# ---------------------------------------------------------------------------
# Orchestration ML + LLM (étape B.3 du WBS).
#
# Point d'entrée unique du portail : classer_ticket(titre, description, module).
#
#   1. Le Random Forest classe le ticket et produit un score de confiance.
#   2. Si ce score atteint le seuil calibré (0,76), sa classe est retenue.
#   3. Sinon, Mistral est appelé via Ollama et c'est SA classe qui prime :
#      le routage l'a sollicité précisément parce que le ML doutait.
#   4. Une réponse LLM absente, illisible ou hors nomenclature ne remplace
#      jamais la classe ML : elle lève seulement `relecture_requise`.
#
# Le texte suit EXACTEMENT la même chaîne qu'à l'entraînement :
# nettoyage (A.1) puis lemmatisation et filtrage (A.2 + A.3) avant le TF-IDF.
# Sans cela, la quasi-totalité des mots manquerait le vocabulaire de 1 871
# termes appris et le modèle déciderait sur un vecteur presque vide.
# ---------------------------------------------------------------------------

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

logger = logging.getLogger(__name__)

# --- Emplacement des artefacts -------------------------------------------
DOSSIER_MODELES = Path(__file__).resolve().parent / "modeles"

# --- Réglages -------------------------------------------------------------
SEUIL_CONFIANCE = 0.76        # 5e centile des scores du jeu de test (B.3.2, méthode de repli)
SEUIL_CALIBRE = True
MODELE_LLM = "mistral"
DELAI_LLM_SECONDES = 30       # au-delà, on garde la classe ML et on demande une relecture
CRITICITES_VALIDES = ("Critique", "Haute", "Moyenne", "Basse")

# --- Chargement paresseux -------------------------------------------------
# Les artefacts sont chargés à la première classification, pas à l'import :
# `manage.py` ne doit pas payer 2 secondes de chargement pour une commande
# qui ne classe rien.
_ARTEFACTS = None
_NLP = None
_MOTS_A_SUPPRIMER = None
_EXECUTEUR = ThreadPoolExecutor(max_workers=2, thread_name_prefix="llm")

NEGATION = {"ne", "pas", "plus", "aucun", "aucune", "jamais", "sans", "ni", "rien", "non"}
MOTS_LIAISON = {
    "donc", "car", "mais", "ainsi", "ensuite", "cependant", "alors", "puis",
    "or", "néanmoins", "toutefois", "enfin", "aussi", "également", "pourtant",
    "effet", "bref", "dabord",
}
POLITESSE = {
    "bonjour", "bonsoir", "salut", "coucou", "hello", "re", "rebonjour", "bjr",
    "merci", "mci", "cordialement", "bien", "svp", "plait", "plaît", "sil",
    "madame", "monsieur", "mme", "mr", "cc",
}


def _charger_artefacts():
    """Charge une seule fois les quatre fichiers .joblib et le gabarit du prompt."""
    global _ARTEFACTS
    if _ARTEFACTS is not None:
        return _ARTEFACTS

    import joblib

    gabarit = (DOSSIER_MODELES / "prompt_classification.txt").read_text(encoding="utf-8")

    _ARTEFACTS = {
        "tfidf": joblib.load(DOSSIER_MODELES / "tfidf_final.joblib"),
        "ohe": joblib.load(DOSSIER_MODELES / "ohe_bloc.joblib"),
        "rf": joblib.load(DOSSIER_MODELES / "modele_final_rf_texte_bloc.joblib"),
        "module_vers_bloc": joblib.load(DOSSIER_MODELES / "regle_module_vers_bloc.joblib"),
        # Le gabarit sauvegardé porte le module d'un ticket précis : on ne
        # garde que la partie réutilisable, avant « TICKET À CLASSER ».
        "corps_prompt": gabarit.split("TICKET À CLASSER")[0].rstrip(),
    }
    logger.info(
        "Artefacts IA chargés : %s termes TF-IDF, %s colonnes attendues.",
        len(_ARTEFACTS["tfidf"].vocabulary_),
        _ARTEFACTS["rf"].n_features_in_,
    )
    return _ARTEFACTS


def _charger_nlp():
    """Charge spaCy et la liste de mots à filtrer, une seule fois."""
    global _NLP, _MOTS_A_SUPPRIMER
    if _NLP is not None:
        return _NLP, _MOTS_A_SUPPRIMER

    import nltk
    import spacy
    from nltk.corpus import stopwords

    try:
        mots_vides = set(stopwords.words("french"))
    except LookupError:
        nltk.download("stopwords", quiet=True)
        mots_vides = set(stopwords.words("french"))

    _NLP = spacy.load("fr_core_news_sm", disable=["ner"])
    _MOTS_A_SUPPRIMER = (mots_vides | MOTS_LIAISON | POLITESSE) - NEGATION
    return _NLP, _MOTS_A_SUPPRIMER


# ---------------------------------------------------------------------------
# Prétraitement du texte — A.1 puis A.2 + A.3
# ---------------------------------------------------------------------------
def nettoyer_texte(texte):
    """A.1 — minuscules, suppression des URL, e-mails, chiffres et ponctuation."""
    if not texte:
        return ""
    texte = texte.lower()
    texte = re.sub(r"[\n\r\t]", " ", texte)
    texte = re.sub(r"http\S+|www\.\S+", " ", texte)
    texte = re.sub(r"\S+@\S+", " ", texte)
    texte = re.sub(r"\d+", " ", texte)
    texte = re.sub(r"[^a-zàâäéèêëïîôöùûüçñ\s]", " ", texte)
    return re.sub(r"\s+", " ", texte).strip()


def lemmatiser(texte_nettoye):
    """A.2 + A.3 — lemmatisation avec contexte, puis filtrage SUR LE LEMME.

    La négation est conservée sans condition : « ne », « pas », « plus »
    portent l'essentiel du sens dans un ticket d'incident.
    """
    if not texte_nettoye:
        return ""
    nlp, a_supprimer = _charger_nlp()
    tokens = []
    for t in nlp(texte_nettoye):
        lemme = t.lemma_.lower()
        if t.text in NEGATION or lemme in NEGATION:
            tokens.append(lemme)
        elif lemme not in a_supprimer and len(lemme) > 1:
            tokens.append(lemme)
    return " ".join(tokens)


def pretraiter(texte):
    """Enchaîne A.1 puis A.2 + A.3, comme à l'entraînement."""
    return lemmatiser(nettoyer_texte(texte))


# ---------------------------------------------------------------------------
# Modèle 1 — Random Forest
# ---------------------------------------------------------------------------
def _predire_ml(titre, description, module):
    """Classe un ticket par le Random Forest et renvoie son score de confiance."""
    import pandas as pd
    from scipy.sparse import hstack

    art = _charger_artefacts()
    regle = art["module_vers_bloc"]

    if module not in regle:
        raise ValueError(
            f"Module inconnu : « {module} ». Valeurs admises : {sorted(regle)}"
        )

    bloc = regle[module]
    debut = time.perf_counter()

    texte = pretraiter(f"{titre} {description}")
    v_txt = art["tfidf"].transform([texte])
    v_blc = art["ohe"].transform(pd.DataFrame({"bloc_concerne": [bloc]}))
    vecteur = hstack([v_txt, v_blc]).tocsr()

    # Un seul parcours de la forêt : predict() ne fait qu'appeler
    # predict_proba() en interne. Le double appel doublait le temps de réponse.
    proba = art["rf"].predict_proba(vecteur)[0]
    i = int(proba.argmax())

    return {
        "criticite": str(art["rf"].classes_[i]),
        "confiance": float(proba[i]),
        "bloc_concerne": bloc,
        "duree_ms": round((time.perf_counter() - debut) * 1000, 1),
    }


# ---------------------------------------------------------------------------
# Modèle 2 — Mistral via Ollama
# ---------------------------------------------------------------------------
def _construire_prompt(titre, description, module):
    art = _charger_artefacts()
    bloc = art["module_vers_bloc"][module]
    return (
        f"{art['corps_prompt']}\n\nTICKET À CLASSER\n"
        f"Sujet : {titre}\n"
        f"Description : {description}\n"
        f"Module : {module}\n"
        f"Bloc concerné : {bloc}"
    )


def _lire_reponse_llm(texte):
    """Extrait la criticité et la justification. Distingue l'échec de format
    de l'erreur de jugement : les deux appellent des corrections différentes."""
    propre = re.sub(r"```(?:json)?", "", texte).strip()
    trouve = re.search(r"\{.*?\}", propre, re.DOTALL)
    if not trouve:
        return None
    try:
        donnees = json.loads(trouve.group(0))
    except json.JSONDecodeError:
        return None
    if donnees.get("criticite") not in CRITICITES_VALIDES:
        return None
    return {
        "criticite": donnees["criticite"],
        "justification": donnees.get("justification", ""),
    }


def _appeler_llm(titre, description, module):
    """Interroge Mistral. Renvoie None en cas d'indisponibilité, de dépassement
    de délai ou de réponse illisible — jamais d'exception."""
    def _travail():
        import ollama
        reponse = ollama.chat(
            model=MODELE_LLM,
            messages=[{"role": "user", "content": _construire_prompt(titre, description, module)}],
            options={"temperature": 0, "num_predict": 200},
        )
        return reponse["message"]["content"]

    try:
        brute = _EXECUTEUR.submit(_travail).result(timeout=DELAI_LLM_SECONDES)
    except Exception as e:
        # Cas courant et attendu : Ollama arrêté, ou réponse trop lente.
        # On garde un message d'une ligne — la classe ML prend le relais.
        logger.warning(
            "LLM indisponible (%s: %s) — classe ML conservée, relecture demandée.",
            type(e).__name__, str(e)[:120],
        )
        return None

    lu = _lire_reponse_llm(brute)
    if lu is None:
        logger.warning("Réponse LLM illisible — classe ML conservée. Brut : %r", brute[:300])
    return lu


# ---------------------------------------------------------------------------
# Point d'entrée du portail
# ---------------------------------------------------------------------------
def classer_ticket(titre, description, module):
    """Classe un ticket et renvoie le résultat prêt à être enregistré.

    Clés renvoyées :
        criticite          criticité retenue (Critique / Haute / Moyenne / Basse)
        source             'ML', 'LLM' ou 'ML (LLM indisponible)'
        confiance_ml       score du Random Forest, entre 0 et 1
        criticite_ml       classe du Random Forest, conservée dans tous les cas
        criticite_llm      classe du LLM, ou None s'il n'a pas été appelé
        justification      phrase rédigée par le LLM, ou ''
        bloc_concerne      bloc déduit du module
        relecture_requise  True quand la décision demande un œil humain
        seuil_applique     seuil de routage utilisé
        seuil_calibre      True si ce seuil provient d'une mesure
    """
    ml = _predire_ml(titre, description, module)

    base = {
        "confiance_ml": round(ml["confiance"], 3),
        "criticite_ml": ml["criticite"],
        "bloc_concerne": ml["bloc_concerne"],
        "seuil_applique": SEUIL_CONFIANCE,
        "seuil_calibre": SEUIL_CALIBRE,
    }

    # 1. Le ML est suffisamment sûr : sa classe est retenue, pas d'appel LLM.
    if ml["confiance"] >= SEUIL_CONFIANCE:
        return {
            **base,
            "criticite": ml["criticite"],
            "criticite_llm": None,
            "justification": "",
            "source": "ML",
            "relecture_requise": False,
        }

    # 2. Le ML doute : on interroge Mistral.
    llm = _appeler_llm(titre, description, module)

    # 3. Pas de réponse exploitable : la classe ML reste, avec relecture.
    if llm is None:
        return {
            **base,
            "criticite": ml["criticite"],
            "criticite_llm": None,
            "justification": "",
            "source": "ML (LLM indisponible)",
            "relecture_requise": True,
        }

    # 4. Réponse valide : c'est la classe du LLM qui prime.
    return {
        **base,
        "criticite": llm["criticite"],
        "criticite_llm": llm["criticite"],
        "justification": llm["justification"],
        "source": "LLM",
        # Un désaccord entre les deux modèles est signalé au superviseur.
        "relecture_requise": llm["criticite"] != ml["criticite"],
    }
