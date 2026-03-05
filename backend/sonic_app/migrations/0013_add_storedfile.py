# Generated manually - store media files in PostgreSQL

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sonic_app', '0012_productlead_product_variant'),
    ]

    operations = [
        migrations.CreateModel(
            name='StoredFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=500, unique=True)),
                ('data', models.BinaryField()),
                ('content_type', models.CharField(default='application/octet-stream', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Stored File',
                'verbose_name_plural': 'Stored Files',
                'db_table': 'sonic_app_storedfile',
            },
        ),
    ]
