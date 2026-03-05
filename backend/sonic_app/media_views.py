"""Serve media files from database (StoredFile) with filesystem fallback."""
import os
from django.http import HttpResponse, Http404
from django.views import View
from django.views.static import serve as static_serve
from django.conf import settings
from .models import StoredFile


class ServeDBMediaView(View):
    """Serve from StoredFile (DB) first, fall back to filesystem if not found."""

    def get(self, request, path):
        try:
            sf = StoredFile.objects.get(name=path)
            return HttpResponse(sf.data, content_type=sf.content_type)
        except StoredFile.DoesNotExist:
            file_path = os.path.join(settings.MEDIA_ROOT, path)
            if os.path.isfile(file_path):
                return static_serve(request, path, document_root=settings.MEDIA_ROOT)
            raise Http404("File not found")
