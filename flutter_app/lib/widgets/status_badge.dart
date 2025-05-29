
import 'package:flutter/material.dart';

enum StatusType { success, warning, error, info }

class StatusBadge extends StatelessWidget {
  final String text;
  final StatusType status;
  final IconData? icon;

  const StatusBadge({
    Key? key,
    required this.text,
    required this.status,
    this.icon,
  }) : super(key: key);

  Color _getColor() {
    switch (status) {
      case StatusType.success:
        return Colors.green;
      case StatusType.warning:
        return Colors.orange;
      case StatusType.error:
        return Colors.red;
      case StatusType.info:
        return Colors.blue;
    }
  }

  IconData _getIcon() {
    if (icon != null) return icon!;
    
    switch (status) {
      case StatusType.success:
        return Icons.check_circle;
      case StatusType.warning:
        return Icons.warning;
      case StatusType.error:
        return Icons.error;
      case StatusType.info:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getColor();
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getIcon(),
            size: 16,
            color: color,
          ),
          SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
