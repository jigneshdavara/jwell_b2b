<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\CustomerGroup;

class Customer extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\CustomerFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'customers';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'type',
        'customer_group_id',
        'kyc_status',
        'preferred_language',
        'credit_limit',
        'kyc_notes',
        'kyc_comments_enabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'credit_limit' => 'float',
            'kyc_comments_enabled' => 'bool',
        ];
    }

    public function kycDocuments()
    {
        return $this->hasMany(UserKycDocument::class, 'user_id');
    }

    public function kycProfile()
    {
        return $this->hasOne(UserKycProfile::class, 'user_id');
    }

    public function loginOtps()
    {
        return $this->hasMany(UserLoginOtp::class, 'user_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function customerGroup()
    {
        return $this->belongsTo(CustomerGroup::class, 'customer_group_id');
    }

    public function jobworkRequests()
    {
        return $this->hasMany(JobworkRequest::class, 'user_id');
    }

    public function carts()
    {
        return $this->hasMany(Cart::class, 'user_id');
    }

    public function wishlist()
    {
        return $this->hasOne(Wishlist::class);
    }

    public function kycMessages()
    {
        return $this->hasMany(UserKycMessage::class, 'user_id');
    }
}

