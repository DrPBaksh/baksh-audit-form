import React from 'react';
import SurveyForm from '../components/Survey/SurveyForm';

const EmployeeSurvey = () => {
  return (
    <SurveyForm
      surveyType="employee"
      title="Employee AI & Data Readiness Assessment"
      description="Assess your individual AI familiarity, usage patterns, training needs, and readiness for AI-driven workflows. Help us understand your perspective on AI adoption."
      showFileUpload={true}
    />
  );
};

export default EmployeeSurvey;
