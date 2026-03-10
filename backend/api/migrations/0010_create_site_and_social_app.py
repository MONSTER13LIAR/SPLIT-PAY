from django.db import migrations

def create_site_and_social_app(apps, schema_editor):
    Site = apps.get_model('sites', 'Site')
    SocialApp = apps.get_model('socialaccount', 'SocialApp')
    
    # Update or create the default site
    site, _ = Site.objects.update_or_create(
        id=1,
        defaults={
            'domain': 'splitpay-backend-t65z.onrender.com',
            'name': 'splitpay'
        }
    )
    
    # Create Google social app if it doesn't exist
    social_app, created = SocialApp.objects.get_or_create(
        provider='google',
        defaults={
            'name': 'Google',
            'client_id': 'PLACEHOLDER',
            'secret': 'PLACEHOLDER',
        }
    )
    
    # Link to site
    social_app.sites.add(site)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0009_vote'),
        ('sites', '0002_alter_domain_unique'),
        ('socialaccount', '0003_extra_data_default_dict'),
    ]

    operations = [
        migrations.RunPython(create_site_and_social_app),
    ]
