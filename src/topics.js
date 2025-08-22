// Topic-based grouping for FAR Part 91 sections
// Groups sections into logical learning topics for better navigation

export const TOPIC_MAP = {
  general: {
    id: 'general',
    title: 'General & Definitions',
    description: 'Fundamental rules, definitions, and scope of Part 91',
    sections: ['91.1', '91.3', '91.5', '91.7', '91.9']
  },
  
  operations: {
    id: 'operations',
    title: 'Flight Operations & Limitations', 
    description: 'Basic flight operations, crew requirements, and operational limits',
    sections: ['91.11', '91.13', '91.15', '91.17', '91.19', '91.21', '91.23', '91.25', '91.101', '91.103', '91.105', '91.107', '91.108', '91.109', '91.111', '91.113', '91.115', '91.117']
  },

  altitudes_airspace: {
    id: 'altitudes_airspace',
    title: 'Altitudes & Airspace Entry',
    description: 'Minimum altitudes, airspace operations, and ATC procedures',
    sections: ['91.119', '91.121', '91.123', '91.125', '91.126', '91.127', '91.129', '91.130', '91.131', '91.133', '91.135']
  },

  restrictions_tfrs: {
    id: 'restrictions_tfrs',
    title: 'Flight Restrictions & TFRs',
    description: 'Temporary flight restrictions, prohibited areas, and emergency procedures',
    sections: ['91.137', '91.138', '91.139', '91.141', '91.143', '91.144', '91.145', '91.146', '91.147']
  },

  vfr_weather_fuel: {
    id: 'vfr_weather_fuel',
    title: 'VFR Weather & Fuel Requirements',
    description: 'VFR weather minimums, fuel requirements, and flight planning',
    sections: ['91.151', '91.153', '91.155', '91.157', '91.159', '91.161']
  },

  ifr_operations: {
    id: 'ifr_operations', 
    title: 'IFR Operations',
    description: 'Instrument flight rules, fuel requirements, and procedures',
    sections: ['91.167', '91.169', '91.171', '91.173', '91.175', '91.176', '91.177', '91.179', '91.180', '91.181', '91.183', '91.185', '91.187', '91.189', '91.191', '91.193']
  },

  equipment_instruments: {
    id: 'equipment_instruments',
    title: 'Equipment & Instruments',
    description: 'Required equipment, instrument requirements, and inoperative equipment',
    sections: ['91.203', '91.205', '91.207', '91.209', '91.211', '91.213', '91.215', '91.217', '91.219', '91.221', '91.223', '91.225', '91.227']
  },

  special_operations: {
    id: 'special_operations',
    title: 'Special Operations',
    description: 'Aerobatic flight, parachuting, towing, and experimental aircraft',
    sections: ['91.303', '91.305', '91.307', '91.309', '91.311', '91.313', '91.315', '91.317', '91.319', '91.321', '91.323', '91.325', '91.326', '91.327']
  },

  maintenance: {
    id: 'maintenance',
    title: 'Maintenance & Inspections',
    description: 'Maintenance requirements, inspections, and record keeping',
    sections: ['91.401', '91.403', '91.405', '91.407', '91.409', '91.411', '91.413', '91.415', '91.417', '91.419', '91.421']
  },

  large_turbine: {
    id: 'large_turbine',
    title: 'Large & Turbine Aircraft',
    description: 'Requirements specific to large aircraft and turbine-powered operations',
    sections: ['91.501', '91.503', '91.505', '91.507', '91.509', '91.511', '91.513', '91.515', '91.517', '91.519', '91.521', '91.523', '91.525', '91.527', '91.529', '91.531', '91.533', '91.535']
  }
};

// Helper function to get all topics as an array
export function getTopics() {
  return Object.values(TOPIC_MAP);
}

// Helper function to find which topic a section belongs to
export function getTopicForSection(sectionId) {
  for (const topic of Object.values(TOPIC_MAP)) {
    if (topic.sections.includes(sectionId)) {
      return topic;
    }
  }
  return null;
}

// Helper function to calculate topic progress
export function calculateTopicProgress(topic, readSections) {
  const totalSections = topic.sections.length;
  const readCount = topic.sections.filter(sectionId => readSections[sectionId]).length;
  return {
    total: totalSections,
    read: readCount,
    percentage: totalSections > 0 ? Math.round((readCount / totalSections) * 100) : 0
  };
}