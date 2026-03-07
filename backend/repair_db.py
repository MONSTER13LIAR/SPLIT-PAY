import os
import django
import sys

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.conf import settings

def setup():
    # Fix Site
    site_id = getattr(settings, 'SITE_ID', 1)
    site, created = Site.objects.get_or_create(id=site_id)
    site.domain = 'localhost:3000'
    site.name = 'SplitPay Dev'
    site.save()
    print(f"Fixed Site ID {site_id}: {site.domain}")

    # Fix/Create SocialApp
    client_id = os.getenv('GOOGLE_CLIENT_ID', '518518930801-6b3lu430juulj4o9d38tvc0sk71vno0q.apps.googleusercontent.com')
    secret = os.getenv('GOOGLE_SECRET', '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')
    
    print(f"Using Client ID: {client_id[:10]}...")
    print(f"Using Secret: {secret[:5]}...")

    app, created = SocialApp.objects.get_or_create(
        provider='google',
        defaults={
            'name': 'Google Auth',
            'client_id': client_id,
            'secret': secret,
        }
    )
    
    if not created:
        app.client_id = client_id
        app.secret = secret
        app.save()
        print("Updated existing SocialApp with correct credentials.")
    else:
        print("Created new SocialApp.")

    app.sites.add(site)
    app.save()
    print(f"SocialApp linked to site '{site.domain}'.")

if __name__ == "__main__":
    setup()
