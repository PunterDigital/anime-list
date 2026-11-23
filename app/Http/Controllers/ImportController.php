<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportUploadRequest;
use App\Jobs\ProcessMalImport;
use App\Services\MalImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ImportController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('ImportPage');
    }

    public function upload(ImportUploadRequest $request, MalImportService $importService): JsonResponse
    {
        $file = $request->file('file');

        try {
            $result = $importService->parse($file->getRealPath(), $request->user()->id);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    public function confirm(Request $request, MalImportService $importService): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'overwrite_existing' => ['boolean'],
        ]);

        $token = $request->input('token');
        $overwrite = $request->boolean('overwrite_existing', false);
        $entries = $importService->getPreview($request->user()->id, $token);

        if ($entries === null) {
            return response()->json(['error' => 'Import session expired. Please upload again.'], 422);
        }

        // Small imports run in the request, but only when every title is
        // already in the catalogue: fetching missing ones from AniList can
        // sleep on its rate limit, so those go to the queue (card 5707).
        if (count($entries) <= 200 && $importService->missingMalIds($entries) === []) {
            try {
                $result = $importService->processEntries($request->user(), $token, $overwrite);
            } catch (\RuntimeException $e) {
                return response()->json(['error' => $e->getMessage()], 422);
            }

            return response()->json([
                'status' => 'done',
                'result' => $result,
            ]);
        }

        Cache::put("import:progress:{$token}", [
            'status' => 'pending',
            'processed' => 0,
            'total' => count($entries),
        ], 3600);

        ProcessMalImport::dispatch($request->user()->id, $token, $overwrite);

        return response()->json([
            'status' => 'pending',
            'token' => $token,
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $token = $request->query('token');

        if (! $token) {
            return response()->json(['error' => 'Token required'], 422);
        }

        $progress = Cache::get("import:progress:{$token}");

        if ($progress === null) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json($progress);
    }
}
