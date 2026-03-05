"""
Database-backed file storage. Stores uploaded files in PostgreSQL instead of filesystem.
Use when you don't want S3/Spaces - images are stored in the database.
"""
import mimetypes
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from .models import StoredFile


@deconstructible
class DatabaseStorage(Storage):
    """Storage backend that saves files to PostgreSQL."""

    def _open(self, name, mode='rb'):
        try:
            sf = StoredFile.objects.get(name=name)
            return ContentFile(sf.data, name=name)
        except StoredFile.DoesNotExist:
            raise FileNotFoundError(name)

    def _save(self, name, content):
        data = content.read() if hasattr(content, 'read') else content
        content_type = mimetypes.guess_type(name)[0] or 'application/octet-stream'
        StoredFile.objects.update_or_create(
            name=name,
            defaults={'data': data, 'content_type': content_type}
        )
        return name

    def delete(self, name):
        StoredFile.objects.filter(name=name).delete()

    def exists(self, name):
        return StoredFile.objects.filter(name=name).exists()

    def size(self, name):
        try:
            return len(StoredFile.objects.get(name=name).data)
        except StoredFile.DoesNotExist:
            return 0

    def url(self, name):
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        return f"{media_url.rstrip('/')}/{name}"
