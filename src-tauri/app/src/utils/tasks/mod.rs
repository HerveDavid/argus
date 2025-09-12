use std::future::Future;
use tokio_util::sync::CancellationToken;

pub mod error;
pub mod state;

use error::{Error, Result};

pub struct CancellableTask<T> {
    handle: Option<tokio::task::JoinHandle<T>>,
    token: CancellationToken,
}

impl<T> CancellableTask<T> {
    pub fn new<F, Fut>(function: F) -> Self
    where
        F: FnOnce(CancellationToken) -> Fut + Send + 'static,
        Fut: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    {
        let token = CancellationToken::new();
        let handle = Some(tokio::spawn(function(token.clone())));
        Self { handle, token }
    }

    pub fn cancel(&self) {
        self.token.cancel();
    }

    pub async fn join(&mut self) -> Result<T> {
        if let Some(handle) = self.handle.take() {
            Ok(handle.await?)
        } else {
            Err(Error::AlreadyConsumed)
        }
    }

    pub fn is_finished(&self) -> bool {
        self.handle.as_ref().map_or(true, |h| h.is_finished())
    }

    pub fn is_cancelled(&self) -> bool {
        self.token.is_cancelled()
    }
}

impl<T> Drop for CancellableTask<T> {
    fn drop(&mut self) {
        self.cancel();
        if let Some(handle) = self.handle.take() {
            handle.abort();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    };
    use tokio::time::{sleep, timeout, Duration};

    #[tokio::test]
    async fn test_task_completion() {
        let mut task = CancellableTask::new(|_token| async {
            sleep(Duration::from_millis(10)).await;
            42
        });

        let result = task.join().await.unwrap();
        assert_eq!(result, 42);
    }

    #[tokio::test]
    async fn test_task_cancellation() {
        let cancelled = Arc::new(AtomicBool::new(false));
        let cancelled_clone = cancelled.clone();

        let mut task = CancellableTask::new(move |token| {
            let cancelled = cancelled_clone.clone();
            async move {
                tokio::select! {
                    _ = sleep(Duration::from_secs(10)) => {
                        1
                    }
                    _ = token.cancelled() => {
                        cancelled.store(true, Ordering::Relaxed);
                        0
                    }
                }
            }
        });

        task.cancel();

        let result = timeout(Duration::from_millis(100), task.join()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().unwrap(), 0);
        assert!(cancelled.load(Ordering::Relaxed));
    }

    #[tokio::test]
    async fn test_multiple_cancels() {
        let mut task = CancellableTask::new(|token| async move {
            tokio::select! {
                _ = sleep(Duration::from_secs(10)) => 1,
                _ = token.cancelled() => 0,
            }
        });

        task.cancel();
        task.cancel();
        task.cancel();

        let result = timeout(Duration::from_millis(100), task.join()).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().unwrap(), 0);
    }

    #[tokio::test]
    async fn test_task_with_error() {
        let mut task = CancellableTask::new(|_token| async {
            panic!("Test panic");
        });

        let result = task.join().await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_cancel_after_completion() {
        let mut task = CancellableTask::new(|_token| async { 42 });

        sleep(Duration::from_millis(10)).await;

        let result = task.join().await.unwrap();
        assert_eq!(result, 42);
    }

    #[tokio::test]
    async fn test_task_status_checks() {
        let mut task = CancellableTask::new(|token| async move {
            tokio::select! {
                _ = sleep(Duration::from_millis(100)) => 42,
                _ = token.cancelled() => 0,
            }
        });

        assert!(!task.is_finished());
        assert!(!task.is_cancelled());

        task.cancel();
        assert!(task.is_cancelled());

        let result = task.join().await.unwrap();
        assert_eq!(result, 0);
    }

    #[tokio::test]
    async fn test_immediate_start() {
        let started = Arc::new(AtomicBool::new(false));
        let started_clone = started.clone();

        let mut task = CancellableTask::new(move |_token| {
            let started = started_clone.clone();
            async move {
                started.store(true, Ordering::Relaxed);
                sleep(Duration::from_millis(50)).await;
                42
            }
        });

        sleep(Duration::from_millis(10)).await;

        assert!(started.load(Ordering::Relaxed));

        let result = task.join().await.unwrap();
        assert_eq!(result, 42);
    }
}
