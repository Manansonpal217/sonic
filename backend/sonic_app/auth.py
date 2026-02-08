"""
Authentication for mobile API (Bearer token from OTP login).
"""
from rest_framework import authentication
from django.utils import timezone
from .models import Session


class BearerTokenAuthentication(authentication.BaseAuthentication):
    """
    Authenticate mobile requests using Authorization: Bearer <token>.
    Token is stored on Session.auth_token when user logs in via OTP.
    """
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)
        if not auth_header:
            return None

        parts = auth_header.decode('utf-8').split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1].strip()
        if not token:
            return None

        try:
            session = Session.objects.select_related('session_user').get(
                auth_token=token,
                expire_date__gt=timezone.now(),
            )
        except Session.DoesNotExist:
            return None

        user = session.session_user
        if not user.is_active or user.is_delete:
            return None

        return (user, session)
