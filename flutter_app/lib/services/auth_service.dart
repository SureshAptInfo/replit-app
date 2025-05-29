
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;

  AuthService() {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token != null) {
        // Verify token with backend
        final response = await ApiService.get('/api/user/profile');
        if (response['success'] == true) {
          _isAuthenticated = true;
          _user = response['user'];
        } else {
          await logout();
        }
      }
    } catch (e) {
      print('Auth check failed: $e');
      await logout();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    try {
      final response = await ApiService.post('/api/auth/login', {
        'username': username,
        'password': password,
      });

      if (response['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', response['token'] ?? '');
        
        _isAuthenticated = true;
        _user = response['user'];
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Login failed: $e');
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiService.post('/api/auth/logout', {});
    } catch (e) {
      print('Logout API call failed: $e');
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
