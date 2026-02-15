# Generated migration for variant dimensions on CategoryField

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sonic_app', '0005_otp_login_user_session_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='categoryfield',
            name='is_variant_dimension',
            field=models.BooleanField(default=False, help_text='Use as variant dimension (max 2 per category, e.g. Size and Weight)'),
        ),
        migrations.AddField(
            model_name='categoryfield',
            name='variant_order',
            field=models.PositiveSmallIntegerField(blank=True, help_text='Order of this variant dimension (1 or 2)', null=True),
        ),
    ]
