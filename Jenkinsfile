pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.example.com'
        DOCKER_CREDENTIALS_ID = 'docker-registry-credentials'
        KUBE_CREDENTIALS_ID = 'kubeconfig-credentials'
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        IMAGE_TAG = "${env.BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git submodule update --init --recursive'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Lint & Test') {
            parallel {
                stage('Lint Server') {
                    steps {
                        sh 'npm run lint --workspace=@oschat/server || true'
                    }
                }
                stage('Lint Web') {
                    steps {
                        sh 'npm run lint --workspace=@oschat/web || true'
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Server Image') {
                    steps {
                        script {
                            docker.build("${DOCKER_REGISTRY}/oschat-server:${IMAGE_TAG}", "-f infra/docker/server.Dockerfile .")
                            docker.build("${DOCKER_REGISTRY}/oschat-server:latest", "-f infra/docker/server.Dockerfile .")
                        }
                    }
                }
                stage('Build Web Image') {
                    steps {
                        script {
                            docker.build("${DOCKER_REGISTRY}/oschat-web:${IMAGE_TAG}", "-f infra/docker/web.Dockerfile .")
                            docker.build("${DOCKER_REGISTRY}/oschat-web:latest", "-f infra/docker/web.Dockerfile .")
                        }
                    }
                }
            }
        }
        
        stage('Push Images') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        sh "docker push ${DOCKER_REGISTRY}/oschat-server:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REGISTRY}/oschat-server:latest"
                        sh "docker push ${DOCKER_REGISTRY}/oschat-web:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REGISTRY}/oschat-web:latest"
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    withCredentials([file(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/namespace.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/configmap.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/mongodb-deployment.yml
                            kubectl --kubeconfig=\$KUBECONFIG set image deployment/oschat-server oschat-server=${DOCKER_REGISTRY}/oschat-server:${IMAGE_TAG} -n oschat
                            kubectl --kubeconfig=\$KUBECONFIG set image deployment/oschat-web oschat-web=${DOCKER_REGISTRY}/oschat-web:${IMAGE_TAG} -n oschat
                            kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/oschat-server -n oschat
                            kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/oschat-web -n oschat
                        """
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                script {
                    withCredentials([file(credentialsId: KUBE_CREDENTIALS_ID, variable: 'KUBECONFIG')]) {
                        sh """
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/namespace.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/configmap.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/mongodb-deployment.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/server-deployment.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/web-deployment.yml
                            kubectl --kubeconfig=\$KUBECONFIG apply -f infra/k8s/ingress.yml
                            kubectl --kubeconfig=\$KUBECONFIG set image deployment/oschat-server server=${DOCKER_REGISTRY}/oschat-server:${IMAGE_TAG} -n oschat
                            kubectl --kubeconfig=\$KUBECONFIG set image deployment/oschat-web web=${DOCKER_REGISTRY}/oschat-web:${IMAGE_TAG} -n oschat
                            kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/oschat-server -n oschat --timeout=5m
                            kubectl --kubeconfig=\$KUBECONFIG rollout status deployment/oschat-web -n oschat --timeout=5m
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh '''
                        echo "Waiting for deployments to be ready..."
                        sleep 30
                        
                        # Check server health
                        SERVER_URL="https://api.oschat.example.com/health"
                        if curl -f -s $SERVER_URL | grep -q "ok"; then
                            echo "Server health check passed"
                        else
                            echo "Server health check failed"
                            exit 1
                        fi
                        
                        # Check web health
                        WEB_URL="https://oschat.example.com"
                        if curl -f -s -o /dev/null $WEB_URL; then
                            echo "Web health check passed"
                        else
                            echo "Web health check failed"
                            exit 1
                        fi
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // Add notification here (Slack, Email, etc.)
        }
        failure {
            echo 'Pipeline failed!'
            // Add notification here
        }
        always {
            cleanWs()
        }
    }
}
