import apiClient from './axiosClient'

export const downloadReport = async (exportFormat, filters = {}) => {
  const response = await apiClient.get('/reports/generate/', {
    params: { export_format: exportFormat, ...filters },
    responseType: 'blob',
  })
  const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rapport_zay.${ext}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}