import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginRequest, logoutRequest, fetchCurrentUser } from '../api/authService'
import { setTokens, clearTokens, getAccessToken } from '../api/tokenStorage'

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginRequest({ email, password })
      setTokens({ access: data.access, refresh: data.refresh })
      return data.user ?? null
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Email ou mot de passe incorrect.'
      return rejectWithValue(message)
    }
  }
)

// Recharge le profil au démarrage de l'app si un token est déjà présent
// (sinon, après un F5, l'utilisateur reste connecté mais son prénom/rôle est perdu).
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCurrentUser()
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Session expirée.')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutRequest()
  } catch {
    // Même si l'appel serveur échoue, on déconnecte l'utilisateur localement.
  } finally {
    clearTokens()
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: Boolean(getAccessToken()),
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.isAuthenticated = true
        state.user = action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        // Token invalide/expiré et non rafraîchissable : on nettoie l'état local.
        state.isAuthenticated = false
        state.user = null
        clearTokens()
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle'
        state.isAuthenticated = false
        state.user = null
      })
  },
})

export default authSlice.reducer
