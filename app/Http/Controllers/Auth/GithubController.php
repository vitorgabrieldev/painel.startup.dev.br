<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GithubController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('github')
            ->scopes(['read:user', 'user:email'])
            ->redirect();
    }

    public function callback(): RedirectResponse
    {
        $githubUser = Socialite::driver('github')->user();

        $email = $githubUser->getEmail();
        if (!$email) {
            return redirect()
                ->route('login')
                ->with('status', 'Nao foi possivel obter o e-mail do GitHub.');
        }

        $user = User::where('github_id', $githubUser->getId())->first();
        if (!$user) {
            $user = User::where('email', $email)->first();
        }

        $name = $githubUser->getName() ?: $githubUser->getNickname() ?: 'Usuario GitHub';
        $nickname = $githubUser->getNickname() ?: Str::slug($name);
        $username = $this->makeUniqueUsername($nickname ?: 'github');

        if ($user) {
            $user->fill([
                'name' => $user->name ?: $name,
                'username' => $user->username ?: $username,
                'github_id' => $githubUser->getId(),
                'github_username' => $githubUser->getNickname(),
                'github_avatar' => $githubUser->getAvatar(),
            ]);
            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
            }
            $user->save();
        } else {
            $user = User::create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => Str::random(32),
                'github_id' => $githubUser->getId(),
                'github_username' => $githubUser->getNickname(),
                'github_avatar' => $githubUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, true);

        $hasProjects = Project::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();

        return redirect()->route($hasProjects ? 'projects.index' : 'dashboard');
    }

    private function makeUniqueUsername(string $base): string
    {
        $base = Str::slug($base);
        $candidate = $base ?: 'user';

        if (!User::where('username', $candidate)->exists()) {
            return $candidate;
        }

        do {
            $candidate = ($base ?: 'user').'-'.Str::lower(Str::random(4));
        } while (User::where('username', $candidate)->exists());

        return $candidate;
    }
}
