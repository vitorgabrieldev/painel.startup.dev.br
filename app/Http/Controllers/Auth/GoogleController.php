<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $email = $googleUser->getEmail();
        if (!$email) {
            return redirect()
                ->route('login')
                ->with('status', 'Nao foi possivel obter o e-mail do Google.');
        }

        $user = User::where('google_id', $googleUser->getId())->first();
        if (!$user) {
            $user = User::where('email', $email)->first();
        }

        $name = $googleUser->getName() ?: 'Usuario Google';
        $usernameSeed = Str::before($email, '@');
        $username = $this->makeUniqueUsername($usernameSeed ?: Str::slug($name));

        if ($user) {
            $user->fill([
                'name' => $user->name ?: $name,
                'username' => $user->username ?: $username,
                'google_id' => $googleUser->getId(),
                'google_avatar' => $googleUser->getAvatar(),
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
                'google_id' => $googleUser->getId(),
                'google_avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, true);

        return redirect()->route('dashboard');
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
