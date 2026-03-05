'use client';

import { use, useEffect, useState } from 'react';
import { useProduct } from '@/lib/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getMediaUrl } from '@/lib/utils/formatters';
import { MediaImage } from '@/components/ui/media-image';
import QRCode from 'qrcode';

function slugify(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'product';
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = parseInt(id);
  const { data: product, isLoading } = useProduct(productId);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!product?.id) return;
    const payload = JSON.stringify({ productId: product.id });
    QRCode.toDataURL(payload, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [product?.id]);

  const handleDownloadQR = () => {
    if (!qrDataUrl || !product) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `product-${product.id}-${slugify(product.product_name)}.png`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.product_name}</h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-lg">{product.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">{product.product_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weight</p>
              <p className="text-lg">{product.product_weight != null && product.product_weight !== '' ? product.product_weight : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={product.product_status ? 'default' : 'secondary'}>
                {product.product_status ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Is Parent Product</p>
              <Badge variant={product.product_is_parent ? 'default' : 'secondary'}>
                {product.product_is_parent ? 'Yes' : 'No'}
              </Badge>
            </div>
            {product.product_parent_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parent Product</p>
                <p className="text-lg">{product.product_parent_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaImage
              src={getMediaUrl(product.product_image)}
              alt={product.product_name}
              width={400}
              height={300}
              className="h-64 w-full rounded object-cover"
            />
          </CardContent>
        </Card>

        {product.product_description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{product.product_description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product QR Code</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sales can scan this QR in the app to open the lead form for this product.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrDataUrl ? (
              <>
                <div className="flex justify-center bg-white p-4 rounded border">
                  <img src={qrDataUrl} alt={`QR for ${product.product_name}`} className="w-48 h-48" />
                </div>
                <Button onClick={handleDownloadQR} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR as PNG
                </Button>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Generating QR...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-lg">{formatDate(product.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-lg">{formatDate(product.updated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


