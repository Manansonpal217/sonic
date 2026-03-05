"""
URL configuration for sonic_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from sonic_app.legal_views import privacy_policy, terms_of_service, account_delete_page

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('sonic_app.urls')),
    path('app/', include('sonic_app.urls')),  # Add /app/ prefix for mobile app endpoints
    # Legal pages for Play Store compliance
    path('privacy/', privacy_policy),
    path('terms/', terms_of_service),
    path('account-delete/', account_delete_page),
    # Swagger/OpenAPI documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development (DEBUG or SERVE_MEDIA for Docker with DEBUG=False)
from decouple import config
_serve_media = settings.DEBUG or config('SERVE_MEDIA', default=False, cast=bool)
if _serve_media:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


