
import 'package:flutter/material.dart';

class CustomCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? child;
  final VoidCallback? onTap;
  final IconData? icon;

  const CustomCard({
    Key? key,
    required this.title,
    this.subtitle,
    this.child,
    this.onTap,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 32,
                  color: Theme.of(context).primaryColor,
                ),
                SizedBox(width: 16),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (subtitle != null) ...[
                      SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    if (child != null) ...[
                      SizedBox(height: 8),
                      child!,
                    ],
                  ],
                ),
              ),
              if (onTap != null)
                Icon(
                  Icons.chevron_right,
                  color: Colors.grey[400],
                ),
            ],
          ),
        ),
      ),
    );
  }
}
