"""
Legal pages for INARA app - Privacy Policy, Terms of Service, and Account Deletion.
Hosted at /privacy/, /terms/, and /account-delete/ for Play Store compliance.
"""
from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt


def _base_html(title: str, content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - INARA</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333; }}
        h1 {{ font-size: 1.5rem; margin-bottom: 1rem; }}
        h2 {{ font-size: 1.2rem; margin-top: 1.5rem; }}
        p {{ margin: 0.5rem 0; }}
        a {{ color: #842B25; }}
        .updated {{ color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <p class="updated">Last updated: March 2025</p>
    {content}
</body>
</html>"""


PRIVACY_CONTENT = """
<h2>1. Information We Collect</h2>
<p>We collect information you provide when registering and using the INARA app, including:</p>
<ul>
    <li>Phone number, email, name, company name, address</li>
    <li>Profile information and photos</li>
    <li>Order and transaction data</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use your information to provide app functionality, process orders, send OTP verification, and improve our services.</p>

<h2>3. Data Sharing</h2>
<p>We may share data with service providers (e.g., SMS for OTP) as necessary to operate the app. We do not sell your personal data.</p>

<h2>4. Data Security</h2>
<p>We use encryption in transit (HTTPS) and secure storage practices to protect your data.</p>

<h2>5. Your Rights</h2>
<p>You may request account deletion at any time through the app (Drawer > Delete Account) or by contacting us. Some data may be retained for legal or security purposes as disclosed.</p>

<h2>6. Contact</h2>
<p>For privacy questions, contact us through the app or your account manager.</p>
"""


TERMS_CONTENT = """
<h2>1. Acceptance</h2>
<p>By using INARA, you agree to these Terms and our Privacy Policy.</p>

<h2>2. Use of Service</h2>
<p>You agree to use the app only for lawful purposes and in accordance with these terms.</p>

<h2>3. Account</h2>
<p>You are responsible for maintaining the security of your account. You may delete your account at any time.</p>

<h2>4. Changes</h2>
<p>We may update these terms. Continued use after changes constitutes acceptance.</p>

<h2>5. Contact</h2>
<p>For questions, contact us through the app or your account manager.</p>
"""


@csrf_exempt
@xframe_options_exempt
@require_GET
def privacy_policy(request):
    """Privacy Policy page - required for Google Play."""
    html = _base_html("Privacy Policy", PRIVACY_CONTENT)
    return HttpResponse(html, content_type="text/html; charset=utf-8")


@csrf_exempt
@xframe_options_exempt
@require_GET
def terms_of_service(request):
    """Terms of Service page - required for registration consent."""
    html = _base_html("Terms of Service", TERMS_CONTENT)
    return HttpResponse(html, content_type="text/html; charset=utf-8")


ACCOUNT_DELETE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delete Account - INARA</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333; }
        h1 { font-size: 1.5rem; margin-bottom: 1rem; }
        p { margin: 0.5rem 0; color: #666; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-weight: 500; margin-bottom: 6px; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        button { padding: 12px 24px; background: #842B25; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: #666; margin-left: 8px; }
        .error { color: #c00; font-size: 14px; margin-top: 8px; }
        .success { color: #0a0; font-size: 14px; margin-top: 8px; }
        .step2 { display: none; }
        .step2.visible { display: block; }
        .back-link { font-size: 14px; color: #842B25; margin-top: 16px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Delete Your INARA Account</h1>
    <p>If you've uninstalled the app, you can delete your account here. Enter your registered phone number and we'll send you a verification code.</p>

    <div id="step1">
        <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" placeholder="e.g. 9876543210" />
        </div>
        <button id="sendOtp">Send Verification Code</button>
        <div id="error1" class="error"></div>
    </div>

    <div id="step2" class="step2">
        <p>We sent a 6-digit code to <strong id="phoneDisplay"></strong>. Enter it below.</p>
        <div class="form-group">
            <label for="otp">Verification Code</label>
            <input type="text" id="otp" placeholder="000000" maxlength="6" />
        </div>
        <button id="deleteBtn">Delete Account</button>
        <button id="backBtn" class="btn-secondary">Change Number</button>
        <div id="error2" class="error"></div>
    </div>

    <div id="success" class="step2">
        <p class="success">Your account has been deleted successfully.</p>
    </div>

    <script>
        var apiBase = '/app';
        var phone = '';

        document.getElementById('sendOtp').onclick = function() {
            var p = document.getElementById('phone').value.trim();
            if (!p) { document.getElementById('error1').textContent = 'Please enter your phone number.'; return; }
            document.getElementById('error1').textContent = '';
            this.disabled = true;
            this.textContent = 'Sending...';
            fetch(apiBase + '/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: p })
            })
            .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
            .then(function(res) {
                if (res.ok) {
                    phone = p;
                    document.getElementById('phoneDisplay').textContent = p;
                    document.getElementById('step1').style.display = 'none';
                    document.getElementById('step2').classList.add('visible');
                } else {
                    document.getElementById('error1').textContent = res.data.error || 'Failed to send code.';
                }
            })
            .catch(function() { document.getElementById('error1').textContent = 'Network error. Please try again.'; })
            .finally(function() {
                document.getElementById('sendOtp').disabled = false;
                document.getElementById('sendOtp').textContent = 'Send Verification Code';
            });
        };

        document.getElementById('backBtn').onclick = function() {
            document.getElementById('step2').classList.remove('visible');
            document.getElementById('step1').style.display = 'block';
            document.getElementById('error2').textContent = '';
            document.getElementById('otp').value = '';
        };

        document.getElementById('deleteBtn').onclick = function() {
            var code = document.getElementById('otp').value.trim();
            if (code.length !== 6) { document.getElementById('error2').textContent = 'Please enter the 6-digit code.'; return; }
            document.getElementById('error2').textContent = '';
            this.disabled = true;
            this.textContent = 'Deleting...';
            fetch(apiBase + '/account-delete-by-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: phone, otp_code: code })
            })
            .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
            .then(function(res) {
                if (res.ok) {
                    document.getElementById('step2').classList.remove('visible');
                    document.getElementById('success').classList.add('visible');
                } else {
                    document.getElementById('error2').textContent = res.data.error || 'Failed to delete account.';
                }
            })
            .catch(function() { document.getElementById('error2').textContent = 'Network error. Please try again.'; })
            .finally(function() {
                document.getElementById('deleteBtn').disabled = false;
                document.getElementById('deleteBtn').textContent = 'Delete Account';
            });
        };
    </script>
</body>
</html>
"""


@csrf_exempt
@xframe_options_exempt
@require_GET
def account_delete_page(request):
    """Web-based account deletion page for users who uninstalled the app. Play Store compliance."""
    return HttpResponse(ACCOUNT_DELETE_HTML, content_type="text/html; charset=utf-8")
