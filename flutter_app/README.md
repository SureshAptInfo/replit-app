
# Flutter App

This Flutter application is designed to work with the Express backend in the main project.

## Getting Started

1. Make sure Flutter is installed on your system
2. Navigate to the flutter_app directory: `cd flutter_app`
3. Install dependencies: `flutter pub get`
4. Run the app: `flutter run`

## Features

- Connects to the Express backend API
- Material Design 3 UI
- HTTP requests to backend endpoints
- Error handling and loading states

## API Integration

The app is configured to connect to your Express server running on `http://0.0.0.0:5000`. Make sure your backend is running before testing API calls.

## Development

- Main app logic is in `lib/main.dart`
- API service is in `lib/services/api_service.dart`
- Add new screens in `lib/screens/`
- Add widgets in `lib/widgets/`

## Building

- For Android: `flutter build apk`
- For iOS: `flutter build ios` (requires macOS and Xcode)
- For web: `flutter build web`
