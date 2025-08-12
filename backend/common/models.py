"""Common Models for our app"""

import uuid

from django.db import models

from common.choices import Status


class BaseModelWithUID(models.Model):
    uid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        unique=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        db_index=True,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def get_all_actives(self):
        return self.__class__.objects.filter(status=Status.ACTIVE).order_by(
            "-created_at"
        )

    def get_all_non_inactives(self):
        return self.__class__.objects.exclude(status=Status.INACTIVE).order_by(
            "-created_at"
        )


class NameDescriptionBaseModel(BaseModelWithUID):
    name = models.CharField(
        max_length=255,
        db_index=True,
    )
    description = models.TextField(
        blank=True,
        null=True,
    )
    entry_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=("entry by"),
        related_name="%(app_label)s_%(class)s_entry_by",
    )
    updated_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=("last updated by"),
        related_name="%(app_label)s_%(class)s_updated_by",
    )

    class Meta:
        abstract = True
