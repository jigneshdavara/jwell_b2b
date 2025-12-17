<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Validate and return a valid per-page value for pagination.
     * 
     * @param int $perPage The requested per-page value
     * @param array $allowed Optional array of allowed values (default: [10, 25, 50, 100])
     * @param int $default Default value if invalid (default: 10)
     * @return int Validated per-page value
     */
    protected function validatePerPage(int $perPage, array $allowed = [10, 25, 50, 100], int $default = 10): int
    {
        return in_array($perPage, $allowed, true) ? $perPage : $default;
    }
}
