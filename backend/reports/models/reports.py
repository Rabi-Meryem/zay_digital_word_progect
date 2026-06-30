from django.db import models
from django.conf import settings



class Report(models.Model):
    """
    Rapport généré par le système (PDF ou Excel).
    Les fichiers sont stockés sur MinIO via django-storages.
    """

    class ReportType(models.TextChoices):
        PDF = "PDF", "PDF"
        EXCEL = "EXCEL", "Excel"

    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reports_generated",
        db_column="generated_by",
    )

    report_type = models.CharField(
        max_length=10,
        choices=ReportType.choices,
    )

    period_start = models.DateField()

    period_end = models.DateField()

    file = models.FileField(
        upload_to="reports/",
        max_length=500,
    )

    generated_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "reports"
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"

        ordering = ["-generated_at"]

        indexes = [
            models.Index(fields=["generated_by", "generated_at"]),
            models.Index(fields=["report_type"]),
        ]

    def __str__(self):
        return (
            f"{self.get_report_type_display()} "
            f"[{self.period_start} - {self.period_end}]"
        )