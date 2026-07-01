export const CRITERIA_COLORS = {
    1: { primary: '#e69675', light: '#faf1ec', border: '#f5e2d6', hover: '#fcebe3', textLight: '#ffffff' },
    2: { primary: '#5abda0', light: '#eef8f5', border: '#d1ede4', hover: '#e6f5ef', textLight: '#ffffff' },
    3: { primary: '#eaa430', light: '#fdf6eb', border: '#f6d59d', hover: '#fbf0de', textLight: '#ffffff' },
    4: { primary: '#4b70b3', light: '#f0f4fa', border: '#d2def0', hover: '#e5edf6', textLight: '#ffffff' },
    5: { primary: '#5ba855', light: '#f2f8f1', border: '#d7eed4', hover: '#e7f4e6', textLight: '#ffffff' },
    6: { primary: '#a653e6', light: '#f6f0fd', border: '#e3cbf7', hover: '#eddffb', textLight: '#ffffff' },
    7: { primary: '#e83e8c', light: '#fdf1f6', border: '#f9c6dc', hover: '#fae3ed', textLight: '#ffffff' },
};

export const getCriterionColor = (id) => {
    return CRITERIA_COLORS[id] || CRITERIA_COLORS[1];
};
