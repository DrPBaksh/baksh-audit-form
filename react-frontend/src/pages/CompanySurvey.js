import React from 'react';
import SurveyForm from '../components/Survey/SurveyForm';

const CompanySurvey = () => {
  return (
    <SurveyForm
      surveyType="company"
      title="Company AI & Data Readiness Assessment"
      description="Evaluate your organization's AI and data maturity across key business dimensions including strategy, governance, infrastructure, and workforce readiness."
      showFileUpload={false}
    />
  );
};

export default CompanySurvey;
