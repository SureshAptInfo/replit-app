
import 'package:flutter/material.dart';
import '../widgets/custom_card.dart';
import '../widgets/status_badge.dart';
import '../services/api_service.dart';

class DataScreen extends StatefulWidget {
  @override
  _DataScreenState createState() => _DataScreenState();
}

class _DataScreenState extends State<DataScreen> {
  List<Map<String, dynamic>> _dataItems = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // You can replace this with actual API call
      // final data = await ApiService.get('/api/data');
      
      // Simulate data loading
      await Future.delayed(Duration(seconds: 1));
      
      setState(() {
        _dataItems = [
          {
            'id': 1,
            'title': 'Sample Item 1',
            'description': 'This is a sample description',
            'status': 'active',
            'date': '2024-01-15',
          },
          {
            'id': 2,
            'title': 'Sample Item 2',
            'description': 'Another sample description',
            'status': 'pending',
            'date': '2024-01-14',
          },
          {
            'id': 3,
            'title': 'Sample Item 3',
            'description': 'Third sample description',
            'status': 'inactive',
            'date': '2024-01-13',
          },
        ];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading data: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  StatusType _getStatusType(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return StatusType.success;
      case 'pending':
        return StatusType.warning;
      case 'inactive':
        return StatusType.error;
      default:
        return StatusType.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Data'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading data...'),
                ],
              ),
            )
          : _dataItems.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inbox,
                        size: 64,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'No data available',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Pull down to refresh',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    await _loadData();
                  },
                  child: ListView.builder(
                    itemCount: _dataItems.length,
                    itemBuilder: (context, index) {
                      final item = _dataItems[index];
                      return CustomCard(
                        title: item['title'],
                        subtitle: item['description'],
                        icon: Icons.data_object,
                        onTap: () {
                          _showItemDetails(item);
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            StatusBadge(
                              text: item['status'],
                              status: _getStatusType(item['status']),
                            ),
                            Text(
                              item['date'],
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showAddItemDialog();
        },
        child: Icon(Icons.add),
      ),
    );
  }

  void _showItemDetails(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(item['title']),
          content: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Description: ${item['description']}'),
              SizedBox(height: 8),
              Text('Status: ${item['status']}'),
              SizedBox(height: 8),
              Text('Date: ${item['date']}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _showAddItemDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Add New Item'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                if (titleController.text.isNotEmpty) {
                  setState(() {
                    _dataItems.add({
                      'id': _dataItems.length + 1,
                      'title': titleController.text,
                      'description': descriptionController.text,
                      'status': 'pending',
                      'date': DateTime.now().toString().split(' ')[0],
                    });
                  });
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Item added successfully')),
                  );
                }
              },
              child: Text('Add'),
            ),
          ],
        );
      },
    );
  }
}
