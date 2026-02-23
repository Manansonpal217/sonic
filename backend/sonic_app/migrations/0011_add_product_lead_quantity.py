# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sonic_app', '0010_product_lead'),
    ]

    operations = [
        migrations.AddField(
            model_name='productlead',
            name='quantity',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
