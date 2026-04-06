<script lang='ts'>
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { authClient } from '$lib/auth'
  import Button from '$lib/components/Button.svelte'

  let email = $state('')
  let password = $state('')
  let error = $state('')
  let loading = $state(false)

  async function handleLogin() {
    error = ''
    loading = true
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        error = result.error.message ?? 'Login failed'
      }
      else {
        goto(`${base}/`)
      }
    }
    catch {
      error = 'Login failed'
    }
    finally {
      loading = false
    }
  }
</script>

<div class='auth-page'>
  <div class='auth-card'>
    <h1>Log In</h1>
    <form onsubmit={(e) => {
      e.preventDefault()
      handleLogin()
    }}>
      <label>
        <span>Email</span>
        <input type='email' bind:value={email} required />
      </label>
      <label>
        <span>Password</span>
        <input type='password' bind:value={password} required />
      </label>
      {#if error}
        <p class='error'>{error}</p>
      {/if}
      <Button full disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</Button>
    </form>
    <p class='switch'>Don't have an account? <a href='{base}/signup'>Sign up</a></p>
  </div>
</div>

<style>
  .auth-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
  }

  .auth-card {
    width: 100%;
    max-width: 24rem;
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 2rem;
  }

  h1 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    color: var(--color-primary);
    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  label span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  input {
    background: var(--color-bg);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 0.95rem;
    font-family: inherit;
    padding: 0.625rem 0.75rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: var(--color-primary);
  }

  .error {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin: 0;
  }

  .switch {
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 1rem 0 0;
  }

  .switch a {
    color: var(--color-primary);
    text-decoration: none;
  }

  .switch a:hover {
    text-decoration: underline;
  }
</style>
