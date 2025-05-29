
import 'package:flutter/material.dart';
import '../widgets/custom_card.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/loading_button.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  void _loadProfile() {
    // Simulate loading profile data
    _nameController.text = 'John Doe';
    _emailController.text = 'john.doe@example.com';
    _phoneController.text = '+1 234 567 8900';
  }

  void _saveProfile() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate API call
    await Future.delayed(Duration(seconds: 2));

    setState(() {
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Profile updated successfully!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            CustomCard(
              title: 'Profile Information',
              icon: Icons.person,
              child: Column(
                children: [
                  SizedBox(height: 16),
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Theme.of(context).primaryColor,
                    child: Icon(
                      Icons.person,
                      size: 50,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 20),
                  CustomTextField(
                    label: 'Full Name',
                    controller: _nameController,
                    prefixIcon: Icons.person_outline,
                  ),
                  SizedBox(height: 16),
                  CustomTextField(
                    label: 'Email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: Icons.email_outlined,
                  ),
                  SizedBox(height: 16),
                  CustomTextField(
                    label: 'Phone Number',
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    prefixIcon: Icons.phone_outlined,
                  ),
                  SizedBox(height: 20),
                  LoadingButton(
                    text: 'Save Changes',
                    onPressed: _saveProfile,
                    isLoading: _isLoading,
                    icon: Icons.save,
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            CustomCard(
              title: 'Settings',
              icon: Icons.settings,
              onTap: () {
                // Navigate to settings
              },
            ),
            CustomCard(
              title: 'Help & Support',
              icon: Icons.help_outline,
              onTap: () {
                // Navigate to help
              },
            ),
            CustomCard(
              title: 'Logout',
              icon: Icons.logout,
              onTap: () {
                _showLogoutDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Logout'),
          content: Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Perform logout
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Logged out successfully')),
                );
              },
              child: Text('Logout'),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}
