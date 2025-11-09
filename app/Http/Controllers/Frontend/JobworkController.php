<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\JobworkStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Jobwork\StoreJobworkRequest;
use App\Models\JobworkRequest;
use App\Models\Offer;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class JobworkController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $product = null;
        $defaultVariantId = null;

        if ($request->filled('product')) {
            $productModel = Product::with(['media' => fn ($media) => $media->orderBy('position'), 'variants' => fn ($variants) => $variants->orderByDesc('is_default')])->find($request->integer('product'));

            if ($productModel) {
                $product = [
                    'id' => $productModel->id,
                    'name' => $productModel->name,
                    'sku' => $productModel->sku,
                    'material' => optional($productModel->material)?->name,
                    'purity' => $productModel->metadata['purity'] ?? $productModel->material?->purity,
                    'gross_weight' => $productModel->gross_weight,
                    'net_weight' => $productModel->net_weight,
                    'base_price' => $productModel->base_price,
                    'making_charge' => $productModel->making_charge,
                    'standard_pricing' => $productModel->standard_pricing,
                    'variants' => $productModel->variants->map(fn ($variant) => [
                        'id' => $variant->id,
                        'label' => $variant->label,
                        'price_adjustment' => $variant->price_adjustment,
                        'is_default' => $variant->is_default,
                    ]),
                    'media' => $productModel->media->map(fn ($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $productModel->name,
                    ]),
                ];

                $defaultVariantId = $productModel->variants->firstWhere('is_default', true)?->id ?? $productModel->variants->first()?->id;
            }
        }

        $jobworks = JobworkRequest::query()
            ->with(['product', 'variant'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn (JobworkRequest $request) => [
                'id' => $request->id,
                'reference' => 'JW'.str_pad((string) $request->id, 5, '0', STR_PAD_LEFT),
                'product' => $request->product?->name,
                'variant' => $request->variant?->label,
                'quantity' => $request->quantity,
                'submission_mode' => $request->submission_mode,
                'status' => $request->status,
                'delivery_deadline' => optional($request->delivery_deadline)?->toDateString(),
                'created_at' => $request->created_at->toDateTimeString(),
            ]);

        $offers = Offer::query()->where('is_active', true)->latest()->limit(5)->get()->map(fn (Offer $offer) => [
            'code' => $offer->code,
            'name' => $offer->name,
            'description' => $offer->description,
            'value' => $offer->value,
            'type' => $offer->type,
        ]);

        return Inertia::render('Frontend/Jobwork/Index', [
            'prefillProduct' => $product,
            'defaultVariantId' => $defaultVariantId,
            'jobworks' => $jobworks,
            'offers' => $offers,
        ]);
    }

    public function store(StoreJobworkRequest $request): RedirectResponse
    {
        $user = $request->user();

        $product = null;
        $variant = null;
        if ($request->input('submission_mode') === 'catalogue') {
            $product = Product::find($request->input('product_id'));
            if (! $product) {
                return redirect()->back()->with('error', 'Selected design was not found.');
            }

            if ($request->filled('product_variant_id')) {
                $variant = ProductVariant::where('product_id', $product->id)
                    ->where('id', $request->input('product_variant_id'))
                    ->first();

                if (! $variant) {
                    return redirect()->back()->with('error', 'Selected variant is no longer available.');
                }
            }
        }

        DB::transaction(function () use ($request, $user, $product, $variant) {
            JobworkRequest::create([
                'user_id' => $user->id,
                'product_id' => $product?->id,
                'product_variant_id' => $variant?->id,
                'submission_mode' => $request->input('submission_mode'),
                'type' => $request->input('type'),
                'reference_design' => $request->input('reference_design'),
                'reference_url' => $request->input('reference_url'),
                'reference_media' => $request->input('reference_media'),
                'metal' => $request->input('metal', $product?->material?->name),
                'purity' => $request->input('purity', $product?->metadata['purity'] ?? $product?->material?->purity),
                'diamond_quality' => $request->input('diamond_quality'),
                'quantity' => $request->input('quantity'),
                'special_instructions' => $request->input('special_instructions'),
                'delivery_deadline' => $request->input('delivery_deadline'),
                'wastage_percentage' => $request->input('wastage_percentage'),
                'manufacturing_charge' => $request->input('manufacturing_charge'),
                'status' => JobworkStatus::Submitted->value,
                'metadata' => [
                    'source' => $product ? 'catalogue' : 'custom',
                    'product_snapshot' => $product ? [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'standard_pricing' => $product->standard_pricing,
                    ] : null,
                    'variant_snapshot' => $variant ? $variant->only(['label', 'price_adjustment']) : null,
                ],
            ]);
        });

        return redirect()
            ->route('frontend.jobwork.index')
            ->with('success', 'Jobwork request submitted successfully. Our production desk will connect with you shortly.');
    }
}
