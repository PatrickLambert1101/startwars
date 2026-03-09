# Pastures Feature - User Guide

## Overview

The Pastures feature allows you to manage rotational grazing by tracking:
- Multiple pastures/paddocks
- Animal movements between pastures
- Grazing days and rest periods
- Pasture capacity and status

## Getting Started

### Creating Your First Pasture

1. Navigate to **Pastures** tab (Pro feature required)
2. Tap **"+ New"** button
3. Fill in pasture details:
   - **Name**: e.g., "North Paddock"
   - **Code**: Short identifier like "NP" (auto-generated from name)
   - **Size**: Optional, in hectares
   - **Forage Type**: Select from chips (Mixed Grass, Kikuyu, Lucerne, etc.)
   - **Water Source**: Select from chips (Dam, Trough, River, etc.)
   - **Fence Type**: Select from chips (Electric, Barbed Wire, etc.)
   - **Max Capacity**: Maximum number of animals
   - **Target Grazing Days**: Days before rotation needed (default: 7)
   - **Target Rest Days**: Days to rest before re-use (default: 28)
4. Tap **"Create Pasture"**

### Moving Animals Into a Pasture

**Method 1: From Pasture Detail Screen**
1. Tap on a pasture from the list
2. Tap **"📷 Scan Animals In"**
3. Select animals using:
   - **Scan RFID**: Use RFID scanner (future feature)
   - **Select Manually**: Pick from a list
4. Add optional notes
5. Tap **"Move X Animals In"**

**Method 2: From Movement Form**
1. Navigate to Pastures → Movement Form
2. Select **"Move In"** type
3. Choose target pasture
4. Select animals
5. Submit

### Moving Animals Out of a Pasture

**Method 1: Individual Animals**
1. Open pasture detail
2. Find animal in "Current Animals" list
3. Tap **"⬆ Out"** button next to animal

**Method 2: Move All Animals**
1. Open pasture detail
2. Tap **"Move All Out"** button
3. Confirm action

**Method 3: Movement Form**
1. Navigate to Movement Form
2. Select **"Move Out"** type
3. Choose source pasture
4. Select animals (only shows animals in that pasture)
5. Submit

## Understanding Pasture Status

### Status Indicators

**🟢 Green (Ready)**
- Pasture is empty, or
- Animals are grazing within target days
- No capacity issues

**🟡 Yellow (In Use)**
- Animals have grazed 70%+ of target days
- Approaching rotation time

**🔴 Red (Needs Attention)**
- Animals have exceeded target grazing days, or
- Pasture is over capacity
- Action required

### Pasture Cards Show:

- **Occupancy**: Current animals / Max capacity
- **Days Grazed**: How long animals have been in pasture
- **Progress Bar**: Visual indicator of grazing progress
- **Details**: Forage type, water source, size

## Key Features

### Automatic Tracking

- **Occupancy Count**: Auto-updates when animals move in/out
- **Grazing Days**: Calculated from last move-in date
- **Status Updates**: Color changes based on rotation needs
- **Movement History**: Complete audit trail

### Smart Alerts

The system shows:
- Days until rotation needed
- Over-capacity warnings
- Available/resting status

### Statistics Dashboard

Main screen shows:
- Total number of pastures
- Total animals in pastures
- Number of occupied pastures

Detail screen shows:
- Current occupancy
- Days grazed
- Total lifetime movements
- Movement history timeline

## Best Practices

### Pasture Naming

- Use descriptive names: "North Paddock", "Lower 40"
- Use consistent codes: "NP", "L40"
- Add location notes for easy identification

### Capacity Management

- Set realistic max capacity based on pasture size
- Monitor occupancy percentage
- Watch for over-capacity warnings (red badge)

### Rotation Scheduling

- **Target Grazing Days**: Typically 3-7 days for intensive grazing
- **Target Rest Days**: Typically 21-35 days for recovery
- Adjust based on:
  - Forage type
  - Season
  - Rainfall
  - Herd size

### Movement Tracking

- Always add notes for special movements
- Use manual selection when RFID scanner unavailable
- Check movement history to review patterns

## Common Workflows

### Daily Check

1. Open Pastures tab
2. Check for red status indicators
3. Review pastures approaching rotation
4. Plan next moves

### Rotation Day

1. View pasture needing rotation
2. Tap "Move All Out"
3. Confirm movement
4. Move to next pasture using "Scan Animals In"

### Planning Ahead

1. Review empty pastures
2. Check "Available From" dates
3. Plan rotation sequence
4. Ensure adequate rest periods

## Tips & Tricks

### Quick Pasture Creation

- Name is required, code auto-generates
- Skip optional fields if not needed
- Can always edit later

### Batch Operations

- "Move All Out" saves time vs individual moves
- Select multiple animals in movement form
- Clear all to start over

### Movement History

- Review past 10 movements in detail screen
- Use to identify patterns
- Track average grazing periods

### Editing Pastures

- Tap settings icon on detail screen
- Update any field except name/code
- Save changes

## Troubleshooting

### Pasture Not Showing Animals

**Check**:
- Animals have `current_pasture_id` set
- Movement was completed successfully
- Database synced

### Status Not Updating

**Check**:
- Refresh the screen
- Verify target grazing days are set
- Check last grazed date

### Can't Move Animals In

**Check**:
- Animals aren't already in a pasture
- Pasture is active
- Animal status is active

### Movement History Missing

**Check**:
- Movements were created (not just animal updates)
- Filter isn't hiding movements
- Database permissions

## Advanced Usage

### Custom Forage Types

- Select existing type or leave blank
- Can add custom text in notes

### Multi-Species Pastures

- No species restriction on pastures
- Track cattle, sheep, goats together
- Review by species in animal list

### Seasonal Pastures

- Deactivate pastures during off-season
- Reactivate when needed
- Maintains history

## Future Enhancements

Coming soon:
- RFID scanner integration
- Automated rotation scheduling
- Pasture health scoring
- Forage yield tracking
- Weather integration
- Grazing reports and analytics
