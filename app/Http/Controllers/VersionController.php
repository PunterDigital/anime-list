<?php

namespace App\Http\Controllers;

use App\Support\DeployedVersion;
use Illuminate\Http\JsonResponse;

class VersionController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()
            ->json(DeployedVersion::current()->toArray())
            ->header('Cache-Control', 'no-store');
    }
}
