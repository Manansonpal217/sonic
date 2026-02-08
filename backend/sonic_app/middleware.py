"""Request logging and CSRF exemption for API."""


class DisableCSRFForAPIMiddleware:
    """
    Skip CSRF check for /app/ and /api/ so mobile and other API clients can POST
    without a CSRF token. Must run before django.middleware.csrf.CsrfViewMiddleware.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.path.startswith("/app/") or request.path.startswith("/api/"):
            request.csrf_processing_done = True


class RequestLogMiddleware:
    """Log every incoming request so we can see API calls in the backend terminal."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"[BACKEND] {request.method} {request.path}", flush=True)
        return self.get_response(request)
