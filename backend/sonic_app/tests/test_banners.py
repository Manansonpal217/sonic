"""
Tests for Banners API - list, active, create, update, delete.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile

from sonic_app.models import Banners, Category, Product


class BannersAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = '/app/banners/'
        self.active_url = '/app/banners/active/'

        # Create category and product for banner link
        self.category = Category.objects.create(
            category_name='Test Category',
            category_status=True,
            is_delete=False,
        )
        self.product = Product.objects.create(
            product_name='Test Product',
            product_weight='10g',
            product_category=self.category,
            product_status=True,
            is_delete=False,
        )

    def test_list_banners_returns_200(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)

    def test_active_banners_returns_only_active(self):
        Banners.objects.create(
            banner_title='Active Banner',
            banner_status=True,
            banner_order=0,
            is_delete=False,
        )
        Banners.objects.create(
            banner_title='Inactive Banner',
            banner_status=False,
            banner_order=1,
            is_delete=False,
        )
        response = self.client.get(self.active_url)
        self.assertEqual(response.status_code, 200)
        # active/ returns list (not paginated)
        self.assertIsInstance(response.data, list)
        titles = [b['banner_title'] for b in response.data]
        self.assertIn('Active Banner', titles)
        self.assertNotIn('Inactive Banner', titles)

    def test_active_banners_excludes_soft_deleted(self):
        Banners.objects.create(
            banner_title='Deleted Banner',
            banner_status=True,
            banner_order=0,
            is_delete=True,
        )
        response = self.client.get(self.active_url)
        self.assertEqual(response.status_code, 200)
        titles = [b['banner_title'] for b in response.data]
        self.assertNotIn('Deleted Banner', titles)

    def test_create_banner_with_required_fields(self):
        # Create without image (banner_image can be null/blank)
        data = {
            'banner_title': 'New Promo',
            'banner_status': True,
            'banner_order': 0,
        }
        response = self.client.post(
            self.list_url,
            data,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['banner_title'], 'New Promo')
        self.assertTrue(response.data['banner_status'])
        self.assertEqual(Banners.objects.filter(banner_title='New Promo').count(), 1)

    def test_create_banner_with_product_link(self):
        data = {
            'banner_title': 'Product Banner',
            'banner_product_id': self.product.id,
            'banner_status': True,
            'banner_order': 0,
        }
        response = self.client.post(
            self.list_url,
            data,
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['banner_product_id'], self.product.id)
        self.assertEqual(response.data['banner_product_name'], 'Test Product')

    def test_create_banner_with_image(self):
        # Simple 1x1 pixel PNG
        image_content = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\x00\x01'
            b'\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        image_file = SimpleUploadedFile(
            'test_banner.png',
            image_content,
            content_type='image/png',
        )
        data = {
            'banner_title': 'Banner With Image',
            'banner_image': image_file,
            'banner_status': True,
            'banner_order': 0,
        }
        response = self.client.post(
            self.list_url,
            data,
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        self.assertIsNotNone(response.data.get('banner_image'))
        banner = Banners.objects.get(banner_title='Banner With Image')
        self.assertTrue(bool(banner.banner_image))

    def test_get_banner_by_id(self):
        banner = Banners.objects.create(
            banner_title='Get Me',
            banner_status=True,
            banner_order=0,
            is_delete=False,
        )
        response = self.client.get(f'{self.list_url}{banner.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['banner_title'], 'Get Me')

    def test_update_banner(self):
        banner = Banners.objects.create(
            banner_title='Original',
            banner_status=True,
            banner_order=0,
            is_delete=False,
        )
        data = {
            'banner_title': 'Updated Title',
            'banner_status': False,
        }
        response = self.client.patch(
            f'{self.list_url}{banner.id}/',
            data,
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        banner.refresh_from_db()
        self.assertEqual(banner.banner_title, 'Updated Title')
        self.assertFalse(banner.banner_status)

    def test_delete_banner(self):
        banner = Banners.objects.create(
            banner_title='To Delete',
            banner_status=True,
            banner_order=0,
            is_delete=False,
        )
        response = self.client.delete(f'{self.list_url}{banner.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Banners.objects.filter(id=banner.id).exists())
