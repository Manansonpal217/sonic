# Generated migration: Product price optional, ProductVariant, Cart/OrderItem variant support

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sonic_app', '0006_categoryfield_variant_dimensions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='product_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.CreateModel(
            name='ProductVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('variant_value_1', models.CharField(help_text='First variant dimension value (e.g. Size)', max_length=255)),
                ('variant_value_2', models.CharField(blank=True, help_text='Second variant dimension value (e.g. Weight)', max_length=255, null=True)),
                ('price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('display_order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='sonic_app.product')),
            ],
            options={
                'verbose_name': 'Product Variant',
                'verbose_name_plural': 'Product Variants',
                'db_table': 'sonic_app_product_variant',
                'ordering': ['product', 'display_order', 'id'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='addtocart',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='addtocart',
            name='cart_variant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cart_items', to='sonic_app.productvariant'),
        ),
        migrations.AlterUniqueTogether(
            name='addtocart',
            unique_together={('cart_user', 'cart_product', 'cart_variant', 'cart_status')},
        ),
        migrations.AddField(
            model_name='orderitem',
            name='product_variant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='order_items', to='sonic_app.productvariant'),
        ),
        migrations.AlterField(
            model_name='orderitem',
            name='price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
