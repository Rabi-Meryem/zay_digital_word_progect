from django.urls import path

print("========== REPORTS URLS LOADED ==========")

from .views import GenerateReportView, ReportListView

urlpatterns = [
   
    path('reports/generate/', GenerateReportView.as_view(), name='report-generate'),
    path('reports/', ReportListView.as_view(), name='report-list'),
]