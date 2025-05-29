
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/custom_card.dart';
import '../widgets/status_badge.dart';

class IntegrationsScreen extends StatefulWidget {
  @override
  _IntegrationsScreenState createState() => _IntegrationsScreenState();
}

class _IntegrationsScreenState extends State<IntegrationsScreen> {
  List<dynamic> _integrations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadIntegrations();
  }

  Future<void> _loadIntegrations() async {
    try {
      final data = await ApiService.get('/api/integrations');
      setState(() {
        _integrations = data['integrations'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      print('Failed to load integrations: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Integrations'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadIntegrations,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Available Integrations',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 16),
                    _buildWhatsAppIntegration(),
                    SizedBox(height: 16),
                    _buildEmailIntegration(),
                    SizedBox(height: 16),
                    _buildWebhooksIntegration(),
                    SizedBox(height: 24),
                    if (_integrations.isNotEmpty) ...[
                      Text(
                        'Connected Integrations',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 16),
                      ..._integrations.map((integration) => _buildIntegrationCard(integration)),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWhatsAppIntegration() {
    final whatsappIntegration = _integrations.firstWhere(
      (integration) => integration['type'] == 'whatsapp',
      orElse: () => null,
    );

    return CustomCard(
      title: 'WhatsApp Business',
      subtitle: 'Connect WhatsApp Business API for automated messaging',
      icon: Icons.message,
      color: Colors.green,
      child: Column(
        children: [
          SizedBox(height: 12),
          if (whatsappIntegration != null) ...[
            StatusBadge(
              text: 'Connected',
              status: StatusType.success,
            ),
            SizedBox(height: 12),
            Text('Phone: ${whatsappIntegration['phoneNumber'] ?? 'Not configured'}'),
            SizedBox(height: 12),
            ElevatedButton(
              onPressed: _configureWhatsApp,
              child: Text('Configure'),
            ),
          ] else ...[
            StatusBadge(
              text: 'Not Connected',
              status: StatusType.error,
            ),
            SizedBox(height: 12),
            ElevatedButton(
              onPressed: _connectWhatsApp,
              child: Text('Connect WhatsApp'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmailIntegration() {
    return CustomCard(
      title: 'Email Service',
      subtitle: 'Send automated emails to leads',
      icon: Icons.email,
      color: Colors.blue,
      child: Column(
        children: [
          SizedBox(height: 12),
          StatusBadge(
            text: 'Available',
            status: StatusType.info,
          ),
          SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Email integration coming soon')),
              );
            },
            child: Text('Configure Email'),
          ),
        ],
      ),
    );
  }

  Widget _buildWebhooksIntegration() {
    return CustomCard(
      title: 'Webhooks',
      subtitle: 'Receive real-time notifications from external services',
      icon: Icons.webhook,
      color: Colors.purple,
      child: Column(
        children: [
          SizedBox(height: 12),
          StatusBadge(
            text: 'Available',
            status: StatusType.info,
          ),
          SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Webhook configuration coming soon')),
              );
            },
            child: Text('Configure Webhooks'),
          ),
        ],
      ),
    );
  }

  Widget _buildIntegrationCard(Map<String, dynamic> integration) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getIntegrationColor(integration['type']),
          child: Icon(
            _getIntegrationIcon(integration['type']),
            color: Colors.white,
          ),
        ),
        title: Text(integration['name'] ?? integration['type']),
        subtitle: Text(integration['description'] ?? ''),
        trailing: StatusBadge(
          text: integration['status'] ?? 'unknown',
          status: integration['status'] == 'active' 
              ? StatusType.success 
              : StatusType.error,
        ),
        onTap: () => _showIntegrationDetails(integration),
      ),
    );
  }

  Color _getIntegrationColor(String? type) {
    switch (type) {
      case 'whatsapp':
        return Colors.green;
      case 'email':
        return Colors.blue;
      case 'webhook':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getIntegrationIcon(String? type) {
    switch (type) {
      case 'whatsapp':
        return Icons.message;
      case 'email':
        return Icons.email;
      case 'webhook':
        return Icons.webhook;
      default:
        return Icons.integration_instructions;
    }
  }

  void _connectWhatsApp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Connect WhatsApp Business'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('To connect WhatsApp Business API, you need:'),
            SizedBox(height: 16),
            Text('• WhatsApp Business Account'),
            Text('• Meta Developer Account'),
            Text('• Verified Phone Number'),
            Text('• Access Token'),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Access Token',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Phone Number ID',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // TODO: Implement WhatsApp connection
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('WhatsApp connection feature coming soon')),
              );
            },
            child: Text('Connect'),
          ),
        ],
      ),
    );
  }

  void _configureWhatsApp() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('WhatsApp configuration opened')),
    );
  }

  void _showIntegrationDetails(Map<String, dynamic> integration) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              integration['name'] ?? integration['type'],
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Text('Type: ${integration['type']}'),
            Text('Status: ${integration['status']}'),
            if (integration['lastSync'] != null)
              Text('Last Sync: ${integration['lastSync']}'),
            SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // TODO: Implement sync
                  },
                  child: Text('Sync Now'),
                ),
                SizedBox(width: 16),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // TODO: Implement disconnect
                  },
                  child: Text('Disconnect'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
