pub struct CircularBuffer {
    buffer: Vec<f64>,
    capacity: usize,
    head: usize,
    size: usize,
}

impl CircularBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            buffer: vec![0.0; capacity],
            capacity,
            head: 0,
            size: 0,
        }
    }

    pub fn push(&mut self, value: f64) {
        self.buffer[self.head] = value;
        self.head = (self.head + 1) % self.capacity;

        if self.size < self.capacity {
            self.size += 1;
        }
    }

    pub fn get_range(&self) -> (f64, f64) {
        let values = self.get_current_values();
        let min = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        (min, max)
    }

    fn get_current_values(&self) -> &[f64] {
        if self.size < self.capacity {
            &self.buffer[0..self.size]
        } else {
            &self.buffer[..]
        }
    }

    pub fn get_oldest_values(&self) -> Vec<f64> {
        if self.size < self.capacity {
            self.buffer[0..self.size].to_vec()
        } else {
            let mut result = Vec::with_capacity(self.capacity);
            for i in 0..self.capacity {
                let index = (self.head + i) % self.capacity;
                result.push(self.buffer[index]);
            }
            result
        }
    }

    pub fn get_newest_values(&self) -> Vec<f64> {
        if self.size < self.capacity {
            self.buffer[0..self.size].iter().rev().copied().collect()
        } else {
            let mut result = Vec::with_capacity(self.capacity);
            for i in 0..self.capacity {
                let index = (self.head + self.capacity - 1 - i) % self.capacity;
                result.push(self.buffer[index]);
            }
            result
        }
    }
}
