# IBM Watson Machine Learning Deployment (Optional)

This document explains how to optionally deploy the trained model to IBM Watson Machine Learning (WML). **The application works fully without this — it is entirely optional.**

## Overview

IBM Watson Machine Learning provides a cloud-hosted deployment for ML models. Once deployed, the Flask backend can call the WML scoring endpoint instead of loading the model locally.

## Prerequisites

1. An IBM Cloud account (free tier available)
2. A Watson Machine Learning service instance
3. The `ibm-watson-machine-learning` Python package

```bash
pip install ibm-watson-machine-learning
```

## Step 1: Prepare the Model

The trained model pipeline is saved as `models/best_model.pkl`. For WML deployment, the model needs to be serialized in a compatible format.

```python
import joblib
from ibm_watson_machine_learning import APIClient

# Load the trained pipeline
pipeline = joblib.load('models/best_model.pkl')

# Extract just the model (WML may not support full sklearn pipelines)
model = pipeline.named_steps['clf']
```

## Step 2: Authenticate

```python
import os

wml_credentials = {
    'url': os.environ.get('WATSON_URL'),
    'apikey': os.environ.get('WATSON_API_KEY'),
}

client = APIClient(wml_credentials)
client.set.default_project('<your-project-id>')
```

## Step 3: Upload the Model

```python
software_spec_uid = client.software_specifications.get_id_by_name('runtime-22.2-py3.10')

model_metadata = {
    client.repository.ModelMetaNames.NAME: 'Credit Card Approval Predictor',
    client.repository.ModelMetaNames.TYPE: 'scikit-learn_1.1',
    client.repository.ModelMetaNames.SOFTWARE_SPEC_UID: software_spec_uid,
}

published_model = client.repository.store_model(
    model=model,
    meta_props=model_metadata,
)
model_uid = client.repository.get_model_id(published_model)
```

## Step 4: Deploy the Model

```python
deployment_metadata = {
    client.deployments.ConfigurationMetaNames.NAME: 'Credit Card Approval Deployment',
    client.deployments.ConfigurationMetaNames.ONLINE: {},
}

deployment = client.deployments.create(
    artifact_uid=model_uid,
    meta_props=deployment_metadata,
)
deployment_uid = client.deployments.get_id(deployment)
```

## Step 5: Obtain the Endpoint

```python
scoring_endpoint = client.deployments.get_scoring_href(deployment)
print(f'Scoring endpoint: {scoring_endpoint}')
```

## Step 6: Consume from Flask

Add the following environment variables to `.env`:

```
WATSON_API_KEY=your_api_key
WATSON_URL=your_wml_url
WATSON_DEPLOYMENT_ID=your_deployment_id
```

Then modify `backend/services/prediction.py` to optionally call WML:

```python
import os
import requests

def call_watson_prediction(features):
    api_key = os.environ.get('WATSON_API_KEY')
    deployment_id = os.environ.get('WATSON_DEPLOYMENT_ID')
    url = os.environ.get('WATSON_URL')

    if not all([api_key, deployment_id, url]):
        return None  # Fall back to local model

    token = get_iam_token(api_key)
    response = requests.post(
        f'{url}/ml/v4/deployments/{deployment_id}/predictions',
        headers={'Authorization': f'Bearer {token}'},
        json={'input_data': [{'fields': list(features.keys()), 'values': [list(features.values())]}]},
    )
    return response.json()
```

## Fallback Behavior

If WML credentials are not configured, the Flask backend automatically uses the locally saved model (`models/best_model.pkl`). No configuration is required for local operation.

## Notes

- The free tier of WML supports a limited number of deployments.
- Model retraining requires re-uploading to WML.
- WML scoring latency may be higher than local inference.
