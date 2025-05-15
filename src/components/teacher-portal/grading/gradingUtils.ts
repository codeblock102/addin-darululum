
export const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'average': return 'text-yellow-600';
    case 'needsWork': return 'text-orange-600';
    case 'horrible': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const getQualityPercentage = (quality: string) => {
  switch (quality) {
    case 'excellent': return 100;
    case 'good': return 80;
    case 'average': return 60;
    case 'needsWork': return 40;
    case 'horrible': return 20;
    default: return 0;
  }
};
