<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectChatController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDataController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('Landing', [
        'appVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/c/{project:uuid}', [ChatController::class, 'show'])->name('chat.show');
    Route::get('/termos-de-uso', function () {
        return Inertia::render('Legal/Terms');
    })->name('legal.terms');
    Route::get('/politica-de-privacidade', function () {
        return Inertia::render('Legal/Privacy');
    })->name('legal.privacy');

    Route::post('/projects/chat/start', [ProjectChatController::class, 'start'])
        ->name('projects.chat.start');
    Route::post('/projects/manual', [ProjectChatController::class, 'createManual'])
        ->name('projects.manual.create');
    Route::post('/projects/{project}/chat/answer', [ProjectChatController::class, 'answer'])
        ->name('projects.chat.answer');
    Route::post('/projects/{project}/chat/finalize', [ProjectChatController::class, 'finalize'])
        ->name('projects.chat.finalize');
    Route::get('/p/{project:uuid}', [ProjectController::class, 'show'])->name('projects.show');

    Route::patch('/projects/{project}', [ProjectDataController::class, 'updateProject'])->name('projects.update');
    Route::post('/projects/{project}/stack', [ProjectDataController::class, 'addTechStack'])->name('projects.stack.store');
    Route::post('/projects/{project}/patterns', [ProjectDataController::class, 'addPattern'])->name('projects.patterns.store');
    Route::post('/projects/{project}/risks', [ProjectDataController::class, 'addRisk'])->name('projects.risks.store');
    Route::post('/projects/{project}/integrations', [ProjectDataController::class, 'addIntegration'])->name('projects.integrations.store');
    Route::post('/projects/{project}/governance', [ProjectDataController::class, 'addGovernance'])->name('projects.governance.store');
    Route::post('/projects/{project}/nfrs', [ProjectDataController::class, 'addNfr'])->name('projects.nfrs.store');
    Route::post('/projects/{project}/decisions', [ProjectDataController::class, 'addDecision'])->name('projects.decisions.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
