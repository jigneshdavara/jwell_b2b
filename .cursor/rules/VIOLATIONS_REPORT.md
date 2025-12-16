# Code Violations Report

This document lists violations of rules found during the rules documentation process.

**Generated**: Based on codebase scan
**Status**: Violations detected, refactoring recommended

## Critical Violations

### 1. Duplicated Pricing Logic in Controller
**File**: `app/Http/Controllers/Frontend/CatalogController.php`
**Lines**: 213-264
**Violation**: Pricing calculation logic duplicated instead of using `PricingService`

**Issue**: 
- The `index()` method contains inline pricing calculation (metal cost, diamond cost, making charge)
- This duplicates logic from `app/Services/PricingService.php`
- Violates "Single Source of Truth" rule
- Violates "No copy-pasted pricing logic" rule

**Impact**: 
- If pricing logic changes, must update in multiple places
- Risk of inconsistencies between catalog list and other price calculations

**Recommended Fix**:
1. Extract pricing calculation to use `PricingService::calculateProductPrice()`
2. Or create batch method: `PricingService::calculateProductPrices(Collection $products, ?Customer $user)`
3. Pre-calculate prices when products are loaded

### 2. KYC Documents Stored in Public Disk
**File**: `app/Http/Controllers/Frontend/KycOnboardingController.php`
**Line**: 112
**Violation**: KYC documents stored in 'public' disk, making them accessible via URL

**Issue**:
- KYC documents are sensitive (PAN, Aadhaar, GST certificates)
- Stored in `Storage::disk('public')` which is publicly accessible
- Security risk: Anyone with URL can access documents

**Impact**: 
- Sensitive personal/business documents exposed
- Compliance violation (GDPR, data protection regulations)

**Recommended Fix**:
1. Move to 'private' or 'local' disk
2. Use signed URLs for temporary access
3. Ensure authorization check before serving files (already exists in `downloadDocument()` method)

### 3. Large Component Files (Should Be Split)
**Files**: 
- `resources/js/Pages/Frontend/Catalog/Show.tsx` (828 lines)
- `resources/js/Pages/Admin/Users/KycReview.tsx` (642 lines)

**Violation**: Component size exceeds 300-line guideline

**Issue**:
- Large components are hard to maintain
- Violates component size limit guideline

**Recommended Fix**:
1. Extract variant selector to separate component
2. Extract price display section to separate component
3. Extract configuration section to separate component
4. Use custom hooks for complex logic

### 4. Performance: Recalculating Prices in Loop
**File**: `app/Http/Controllers/Frontend/CatalogController.php`
**Lines**: 206-290
**Violation**: Prices recalculated for each product in loop

**Issue**:
- Inefficient: Multiple database queries per product
- Should use batch calculation or caching
- Violates performance rule about tight loops

**Recommended Fix**:
1. Use `PricingService::calculateProductPrices()` batch method (to be created)
2. Cache price rates (they change infrequently)
3. Pre-calculate and store prices in database, recalculate on rate change

### 5. UI Status Colors Review (Status: Correct Implementation)

**Status Colors (Allowed):**
- ✅ Green for success - Correctly implemented
- ✅ Red/Rose for errors - Correctly implemented  
- ✅ Yellow/Amber for warnings - Correctly implemented

**Files with Correct Status Colors:**
1. **FlashMessage.tsx** - ✅ Uses emerald for success, rose for error (correct)
2. **InputError.tsx** - ✅ Uses red-600 for error text (correct)
3. **AlertModal.tsx** - ✅ Uses amber for warning, rose for error (correct)
4. **CustomizationSection.tsx** - ✅ Uses rose colors for validation errors (correct)
5. **Catalog/Show.tsx** - ✅ Uses rose colors for validation errors (correct)
6. **Admin/Orders/Index.tsx** - ✅ Uses emerald, rose, amber for status badges (correct)
7. **Frontend/Orders/Index.tsx** - ✅ Uses emerald, rose, amber for status badges (correct)
8. **Admin/Quotations/Show.tsx** - ✅ Uses emerald for approved, rose for rejected (correct)

**Status Colors to Review:**
- `resources/js/Pages/Admin/Orders/Index.tsx` - Uses indigo, blue, purple for production statuses (consider if these should be info/neutral statuses using Elvee Blue instead)
- `resources/js/Pages/Frontend/Orders/Index.tsx` - Uses indigo, blue, purple for production statuses (consider if these should be info/neutral statuses using Elvee Blue instead)

**Note:** Green, red, and yellow are allowed for error/success/warning status indicators. Only non-status UI elements must use brand colors (Elvee Blue, Feather Gold, Ivory).

## Missing Implementations (NOT FOUND)

### 1. Webhook Idempotency for Payments
**Status**: NOT FOUND
**Recommended**: Implement webhook handler with idempotency check
**Location**: `app/Http/Controllers/Api/PaymentWebhookController.php`

### 2. KYC Status Change Audit Log
**Status**: NOT FOUND
**Recommended**: Create `KycStatusHistory` model similar to `OrderStatusHistory`
**Location**: `app/Models/KycStatusHistory.php`, migration in `database/migrations/`

### 3. Settings Model/Service
**Status**: NOT FOUND
**Recommended**: Create Settings model and service
**Location**: `app/Models/Setting.php`, `app/Services/SettingsService.php`

### 4. Exception Handler Production Configuration
**Status**: NOT VERIFIED
**Recommended**: Verify `app/Exceptions/Handler.php` has production-safe error handling

### 5. Logging Service with Secret Filtering
**Status**: NOT FOUND
**Recommended**: Create `app/Services/LoggingService.php` with `safeLog()` method

---

**Next Steps**:
1. Prioritize critical violations (pricing duplication, KYC storage)
2. Create tickets/PRs for each violation
3. Refactor code to follow rules
4. Update rules if patterns change

