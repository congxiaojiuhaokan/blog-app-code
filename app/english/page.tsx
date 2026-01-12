"use client";

import React, { useState } from 'react';

interface EnglishExercise {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const EnglishPage: React.FC = () => {
  // 模拟英语练习数据
  const exercises: EnglishExercise[] = [
    {
      id: 1,
      question: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: 'Which of the following is a programming language?',
      options: ['HTML', 'CSS', 'JavaScript', 'XML'],
      correctAnswer: 2,
    },
    {
      id: 3,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
    },
  ];

  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === exercises[currentExercise].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentExercise(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  const exercise = exercises[currentExercise];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">英语练习</h1>
      
      {currentExercise < exercises.length ? (
        <div className="p-6 border border-gray-200 rounded-lg shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              问题 {currentExercise + 1}/{exercises.length}
            </h2>
            <p className="text-gray-700 mb-6">{exercise.question}</p>
            
            <div className="space-y-3">
              {exercise.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    selectedAnswer === null
                      ? 'border-gray-200 hover:border-blue-300'
                      : index === exercise.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : index === selectedAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  disabled={showResult}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          
          {showResult && (
            <div className="mt-6">
              <p className="text-lg font-medium mb-4">
                {selectedAnswer === exercise.correctAnswer
                  ? '正确！'
                  : `错误。正确答案是：${exercise.options[exercise.correctAnswer]}`}
              </p>
              <div className="flex justify-between">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  重新开始
                </button>
                {currentExercise < exercises.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    下一题
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 border border-gray-200 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">练习完成！</h2>
          <p className="text-lg text-gray-700 mb-6">
            你的得分：{score}/{exercises.length}
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
};

export default EnglishPage;