
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/custom_card.dart';
import '../widgets/status_badge.dart';

class LeadsScreen extends StatefulWidget {
  @override
  _LeadsScreenState createState() => _LeadsScreenState();
}

class _LeadsScreenState extends State<LeadsScreen> {
  List<dynamic> _leads = [];
  bool _isLoading = true;
  String _selectedStatus = 'all';

  final List<Map<String, dynamic>> _statusFilters = [
    {'value': 'all', 'label': 'All Leads'},
    {'value': 'new', 'label': 'New'},
    {'value': 'contacted', 'label': 'Contacted'},
    {'value': 'qualified', 'label': 'Qualified'},
    {'value': 'converted', 'label': 'Converted'},
    {'value': 'lost', 'label': 'Lost'},
  ];

  @override
  void initState() {
    super.initState();
    _loadLeads();
  }

  Future<void> _loadLeads() async {
    try {
      final data = await ApiService.get('/api/leads');
      setState(() {
        _leads = data['leads'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      print('Failed to load leads: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredLeads {
    if (_selectedStatus == 'all') {
      return _leads;
    }
    return _leads.where((lead) => lead['status'] == _selectedStatus).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Leads'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: _showAddLeadDialog,
          ),
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _isLoading = true;
              });
              _loadLeads();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildStatusFilter(),
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadLeads,
                    child: _filteredLeads.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.people_outline,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'No leads found',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: EdgeInsets.all(16),
                            itemCount: _filteredLeads.length,
                            itemBuilder: (context, index) {
                              final lead = _filteredLeads[index];
                              return _buildLeadCard(lead);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusFilter() {
    return Container(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _statusFilters.length,
        itemBuilder: (context, index) {
          final filter = _statusFilters[index];
          final isSelected = _selectedStatus == filter['value'];
          
          return Padding(
            padding: EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(filter['label']),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedStatus = filter['value'];
                });
              },
              backgroundColor: Colors.grey[200],
              selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLeadCard(Map<String, dynamic> lead) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).primaryColor,
          child: Text(
            (lead['name'] ?? '?')[0].toUpperCase(),
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          lead['name'] ?? 'Unknown',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (lead['email'] != null) Text(lead['email']),
            if (lead['phone'] != null) Text(lead['phone']),
            SizedBox(height: 4),
            Row(
              children: [
                StatusBadge(
                  text: lead['status'] ?? 'unknown',
                  status: _getStatusType(lead['status']),
                ),
                Spacer(),
                Text(
                  lead['createdAt'] ?? '',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
        isThreeLine: true,
        onTap: () => _showLeadDetails(lead),
      ),
    );
  }

  StatusType _getStatusType(String? status) {
    switch (status) {
      case 'new':
        return StatusType.info;
      case 'contacted':
        return StatusType.warning;
      case 'qualified':
        return StatusType.success;
      case 'converted':
        return StatusType.success;
      case 'lost':
        return StatusType.error;
      default:
        return StatusType.info;
    }
  }

  void _showLeadDetails(Map<String, dynamic> lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              SizedBox(height: 16),
              Text(
                lead['name'] ?? 'Unknown',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              if (lead['email'] != null)
                ListTile(
                  leading: Icon(Icons.email),
                  title: Text(lead['email']),
                  contentPadding: EdgeInsets.zero,
                ),
              if (lead['phone'] != null)
                ListTile(
                  leading: Icon(Icons.phone),
                  title: Text(lead['phone']),
                  contentPadding: EdgeInsets.zero,
                ),
              ListTile(
                leading: Icon(Icons.flag),
                title: Text('Status'),
                trailing: StatusBadge(
                  text: lead['status'] ?? 'unknown',
                  status: _getStatusType(lead['status']),
                ),
                contentPadding: EdgeInsets.zero,
              ),
              if (lead['source'] != null)
                ListTile(
                  leading: Icon(Icons.source),
                  title: Text('Source: ${lead['source']}'),
                  contentPadding: EdgeInsets.zero,
                ),
              if (lead['notes'] != null && lead['notes'].isNotEmpty)
                Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notes',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(lead['notes']),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddLeadDialog() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Add New Lead'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: 'Name',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: phoneController,
              decoration: InputDecoration(
                labelText: 'Phone',
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
            onPressed: () async {
              if (nameController.text.isNotEmpty) {
                try {
                  await ApiService.post('/api/leads', {
                    'name': nameController.text,
                    'email': emailController.text,
                    'phone': phoneController.text,
                    'status': 'new',
                  });
                  Navigator.pop(context);
                  _loadLeads();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Lead added successfully')),
                  );
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to add lead: $e')),
                  );
                }
              }
            },
            child: Text('Add'),
          ),
        ],
      ),
    );
  }
}
