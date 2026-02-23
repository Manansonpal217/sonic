# Generated manually

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sonic_app', '0011_add_product_lead_quantity'),
    ]

    operations = [
        migrations.AddField(
            model_name='productlead',
            name='product_variant',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='leads',
                to='sonic_app.productvariant'
            ),
        ),
    ]
