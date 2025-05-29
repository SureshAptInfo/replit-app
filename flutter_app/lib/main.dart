
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'screens/profile_screen.dart';
import 'screens/data_screen.dart';
import 'widgets/custom_card.dart';
import 'widgets/loading_button.dart';
import 'widgets/status_badge.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: MainNavigationPage(),
    );
  }
}

class MainNavigationPage extends StatefulWidget {
  @override
  _MainNavigationPageState createState() => _MainNavigationPageState();
}

class _MainNavigationPageState extends State<MainNavigationPage> {
  int _selectedIndex = 0;
  
  final List<Widget> _pages = [
    HomePage(),
    DataScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.data_usage),
            label: 'Data',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String apiResponse = 'No data loaded';
  bool isLoading = false;

  Future<void> fetchData() async {
    setState(() {
      isLoading = true;
    });

    try {
      // Replace with your actual API endpoint
      final response = await http.get(
        Uri.parse('http://0.0.0.0:5000/api/health'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          apiResponse = 'API Response: ${data.toString()}';
        });
      } else {
        setState(() {
          apiResponse = 'Error: ${response.statusCode}';
        });
      }
    } catch (e) {
      setState(() {
        apiResponse = 'Error: $e';
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Flutter App'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CustomCard(
              title: 'Welcome to Flutter App',
              subtitle: 'This Flutter app connects to your Express backend',
              icon: Icons.flutter_dash,
            ),
            SizedBox(height: 16),
            LoadingButton(
              text: 'Fetch Data from API',
              onPressed: fetchData,
              isLoading: isLoading,
              icon: Icons.cloud_download,
            ),
            SizedBox(height: 20),
            CustomCard(
              title: 'API Response',
              icon: Icons.api,
              child: Column(
                children: [
                  SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: Text(
                      apiResponse,
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                      ),
                    ),
                  ),
                  SizedBox(height: 12),
                  StatusBadge(
                    text: apiResponse.contains('Error') ? 'Failed' : 'Success',
                    status: apiResponse.contains('Error') 
                        ? StatusType.error 
                        : StatusType.success,
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            CustomCard(
              title: 'Quick Actions',
              icon: Icons.bolt,
              child: Column(
                children: [
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Feature coming soon!')),
                            );
                          },
                          icon: Icon(Icons.refresh),
                          label: Text('Refresh'),
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: Text('About'),
                                content: Text('Flutter App v1.0.0\nBuilt with Material Design 3'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: Text('OK'),
                                  ),
                                ],
                              ),
                            );
                          },
                          icon: Icon(Icons.info),
                          label: Text('About'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
