
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../widgets/custom_card.dart';
import '../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final data = await ApiService.get('/api/dashboard/stats');
      setState(() {
        _dashboardData = data;
        _isLoading = false;
      });
    } catch (e) {
      print('Failed to load dashboard data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _isLoading = true;
              });
              _loadDashboardData();
            },
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatsCards(),
                    SizedBox(height: 24),
                    _buildLeadStatusChart(),
                    SizedBox(height: 24),
                    _buildRecentActivity(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatsCards() {
    final stats = _dashboardData?['stats'] ?? {};
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Overview',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: CustomCard(
                title: 'Total Leads',
                subtitle: '${stats['totalLeads'] ?? 0}',
                icon: Icons.people,
                color: Colors.blue,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: CustomCard(
                title: 'Active Leads',
                subtitle: '${stats['activeLeads'] ?? 0}',
                icon: Icons.trending_up,
                color: Colors.green,
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: CustomCard(
                title: 'Converted',
                subtitle: '${stats['convertedLeads'] ?? 0}',
                icon: Icons.check_circle,
                color: Colors.orange,
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: CustomCard(
                title: 'This Month',
                subtitle: '${stats['monthlyLeads'] ?? 0}',
                icon: Icons.calendar_month,
                color: Colors.purple,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLeadStatusChart() {
    final statusData = _dashboardData?['statusBreakdown'] ?? {};
    
    return CustomCard(
      title: 'Lead Status Breakdown',
      icon: Icons.pie_chart,
      child: Container(
        height: 200,
        child: statusData.isEmpty
            ? Center(child: Text('No data available'))
            : PieChart(
                PieChartData(
                  sections: _buildPieChartSections(statusData),
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
      ),
    );
  }

  List<PieChartSectionData> _buildPieChartSections(Map<String, dynamic> data) {
    final colors = [Colors.blue, Colors.green, Colors.orange, Colors.red, Colors.purple];
    int index = 0;
    
    return data.entries.map((entry) {
      final color = colors[index % colors.length];
      index++;
      
      return PieChartSectionData(
        value: (entry.value ?? 0).toDouble(),
        title: entry.key,
        color: color,
        radius: 50,
        titleStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();
  }

  Widget _buildRecentActivity() {
    final activities = _dashboardData?['recentActivity'] ?? [];
    
    return CustomCard(
      title: 'Recent Activity',
      icon: Icons.history,
      child: Column(
        children: activities.isEmpty
            ? [
                Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No recent activity'),
                )
              ]
            : activities.take(5).map<Widget>((activity) {
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor,
                    child: Icon(
                      Icons.person,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  title: Text(activity['description'] ?? ''),
                  subtitle: Text(activity['timestamp'] ?? ''),
                  trailing: StatusBadge(
                    text: activity['type'] ?? '',
                    status: StatusType.info,
                  ),
                );
              }).toList(),
      ),
    );
  }
}
